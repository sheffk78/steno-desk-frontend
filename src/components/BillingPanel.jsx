/**
 * BillingPanel — Subscription tab body on Settings.
 *
 * Three states:
 *   1. Active subscriber → show plan + "Manage billing" button (Stripe portal)
 *   2. Comped beta tester → show "Beta access" badge + no upgrade prompt
 *   3. Trialing or expired → show pricing toggle + "Subscribe" button
 *
 * Pricing toggle defaults to Annual (highlights the $219 saving). Annual
 * is positioned as the recommended plan with a "Save 47%" badge.
 *
 * On a successful checkout return, we read ?billing=success from the URL
 * and re-fetch /billing/status so the UI flips immediately (webhooks land
 * within ~1s, but in case the user races the webhook we also poll twice).
 */
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import { redditTrack } from "@/lib/reddit";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, Sparkles } from "lucide-react";

export default function BillingPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState("annual");
  const [params] = useSearchParams();
  const handledRedirect = useRef(false);

  const load = async () => {
    try {
      const { data } = await api.get("/billing/status");
      setStatus(data);
      return data;
    } catch {
      setStatus({ is_active: false, subscription_type: null });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Handle redirect back from Stripe Checkout — runs once on mount.
  // This effect performs NO React state mutations of its own. It cleans
  // the URL via the History API, fires the Reddit Purchase event after
  // polling Stripe, then hard-reloads so the mount effect re-runs and
  // the UI flips to the "active" card naturally.
  useEffect(() => {
    if (handledRedirect.current) return;
    const billing = params.get("billing");
    if (!billing) return;
    handledRedirect.current = true;
    const sessionId = params.get("session_id");

    // Clean the URL (History API — no React state touched).
    const u = new URL(window.location.href);
    u.searchParams.delete("billing");
    u.searchParams.delete("session_id");
    window.history.replaceState({}, "", u.toString());

    if (billing === "canceled") {
      toast("Checkout canceled — no charge.");
      return;
    }
    if (billing !== "success") return;
    toast.success("Subscription active. Welcome aboard!");

    // Async work — runs after the effect body has returned. No React
    // state is touched here; we trigger a hard reload at the end so the
    // mount-effect re-fetches /billing/status fresh.
    const fetchStatus = () =>
      api.get("/billing/status").then((r) => r.data).catch(() => null);
    const firePurchase = (s) => {
      if (!s?.is_active) return false;
      const value = s.subscription_type === "active_annual" ? 249 : 39;
      redditTrack("Purchase", {
        value,
        currency: "USD",
        itemCount: 1,
        transactionId: sessionId || s.stripe_subscription_id || undefined,
        customEventName:
          s.subscription_type === "active_annual" ? "AnnualSubscription" : "MonthlySubscription",
      });
      return true;
    };

    (async () => {
      // Poll up to 3 times waiting for the Stripe webhook to flip status.
      for (const wait of [0, 1500, 2500]) {
        if (wait) await new Promise((r) => setTimeout(r, wait));
        const s = await fetchStatus();
        if (firePurchase(s)) break;
      }
      // Hard reload to re-render with fresh status — mount effect runs again.
      window.location.replace(window.location.pathname);
    })();
  }, []);

  const onSubscribe = async () => {
    setBusy(true);
    // Fire AddToCart intent signal *before* leaving the page — Reddit
    // uses this to build high-intent lookalikes even if the user bails
    // mid-checkout.
    redditTrack("AddToCart", {
      value: plan === "annual" ? 249 : 39,
      currency: "USD",
      customEventName: plan === "annual" ? "AnnualCheckoutStarted" : "MonthlyCheckoutStarted",
    });
    try {
      const { data } = await api.post("/billing/checkout", {
        plan,
        origin: window.location.origin,
      });
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      toast.error(errMessage(e) || "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const onManage = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/billing/portal", {
        origin: window.location.origin,
      });
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      toast.error(errMessage(e) || "Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="text-[14px] text-[#6B7280] py-4 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
      </div>
    );
  }

  // 1a. Admin lifetime — founder access, no billing ever
  if (status?.is_admin_lifetime) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 border border-slate-900 rounded-md p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span className="text-[13px] uppercase tracking-[0.06em] font-semibold text-amber-200">
            Founder access
          </span>
        </div>
        <p className="text-[15px] text-slate-100">
          You have lifetime access to Steno Desk as an admin — no billing, no trial,
          no expiry. Thank you for building this product.
        </p>
      </div>
    );
  }

  // 1. Comped beta tester — celebrate, don't upsell
  if (status?.state_reason === "beta") {
    return (
      <div className="bg-gradient-to-br from-[#FAF3E4]/60 to-white border border-[#D4A056]/30 rounded-md p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-[#B45309]" />
          <span className="text-[13px] uppercase tracking-[0.06em] font-semibold text-[#B45309]">
            Beta access
          </span>
        </div>
        <p className="text-[15px] text-[#374151]">
          You&apos;ve been comped Steno Desk access. No billing — thanks for helping us shape the product.
        </p>
      </div>
    );
  }

  // 2. Paying subscriber (monthly or annual via Stripe)
  if (status?.state_reason === "monthly" || status?.state_reason === "annual") {
    const planLabel =
      status.subscription_type === "active_annual"
        ? "Annual — $249/yr"
        : status.subscription_type === "active_monthly"
        ? "Monthly — $39/mo"
        : "Active";
    const renews = status.subscription_current_period_end?.slice(0, 10);
    return (
      <div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Check className="h-4 w-4 text-emerald-700" />
            <span className="text-[13px] uppercase tracking-[0.06em] font-semibold text-emerald-800">
              Subscription active
            </span>
          </div>
          <div className="text-[15px] text-[#374151] space-y-0.5">
            <div><span className="text-[#6B7280]">Plan: </span><span className="font-medium">{planLabel}</span></div>
            {renews && (
              <div>
                <span className="text-[#6B7280]">
                  {status.cancel_at_period_end ? "Ends: " : "Renews: "}
                </span>
                <span>{renews}</span>
              </div>
            )}
            {status.last_payment_failed_at && (
              <div className="text-amber-800 mt-1.5 text-[14px]">
                ⚠ Last payment failed. Update your card in the billing portal.
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={onManage}
          disabled={busy}
          variant="outline"
          className="border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white"
          data-testid="billing-manage-button"
        >
          {busy ? "Opening…" : "Manage billing"}
        </Button>
        <p className="text-[12px] text-[#6B7280] mt-3">
          Opens Stripe&apos;s secure customer portal — update card, change plan, view invoices, or cancel.
        </p>
      </div>
    );
  }

  // 3. Trialing / expired — show pricing
  const trialEnds = status?.trial_ends_at?.slice(0, 10);
  return (
    <div>
      <p className="text-[15px] text-[#374151] mb-5">
        {trialEnds
          ? <>You&apos;re on a free trial — ends <span className="font-semibold">{trialEnds}</span>.</>
          : "Choose a plan to keep your data and continue using Steno Desk."}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <PricingCard
          id="monthly"
          selected={plan === "monthly"}
          onSelect={() => setPlan("monthly")}
          name="Monthly"
          price="$39"
          cadence="/ month"
          tagline="Pay as you go"
        />
        <PricingCard
          id="annual"
          selected={plan === "annual"}
          onSelect={() => setPlan("annual")}
          name="Annual"
          price="$249"
          cadence="/ year"
          tagline="Save $219 — almost 6 months free"
          badge="Save 47%"
          featured
        />
      </div>

      <Button
        onClick={onSubscribe}
        disabled={busy}
        className="bg-[#1F2937] hover:bg-[#111827] text-white w-full sm:w-auto px-6"
        data-testid="billing-subscribe-button"
      >
        {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…</> : `Subscribe — ${plan === "annual" ? "$249/yr" : "$39/mo"}`}
      </Button>
      <p className="text-[12px] text-[#6B7280] mt-3">
        Secure checkout via Stripe. Cancel anytime. {trialEnds && "Your trial continues until it ends — you won't be charged twice."}
      </p>
    </div>
  );
}

function PricingCard({ id, name, price, cadence, tagline, badge, featured, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`pricing-card-${id}`}
      className={`text-left p-5 border rounded-lg transition-all ${
        selected
          ? featured
            ? "border-[#D4A056] ring-2 ring-[#D4A056]/40 bg-[#FAF3E4]/40"
            : "border-[#1F2937] ring-2 ring-[#1F2937]/30 bg-white"
          : "border-[#E5E1DA] bg-white hover:border-[#1F2937]/40"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-[12px] tracking-[0.08em] uppercase text-[#6B7280] font-semibold">{name}</div>
        {badge && (
          <span className="text-[11px] uppercase tracking-[0.05em] bg-[#D4A056] text-white px-2 py-0.5 rounded font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[30px] font-semibold tabular text-[#1F2937]">{price}</span>
        <span className="text-[15px] text-[#6B7280]">{cadence}</span>
      </div>
      <div className={`text-[13px] ${featured ? "text-[#B45309] font-medium" : "text-[#6B7280]"}`}>
        {tagline}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[13px]">
        <span className={`h-3.5 w-3.5 rounded-full border ${selected ? "border-[#1F2937] bg-[#1F2937]" : "border-[#9CA3AF]"} flex items-center justify-center`}>
          {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
        </span>
        <span className={selected ? "text-[#1F2937] font-medium" : "text-[#6B7280]"}>
          {selected ? "Selected" : "Choose"}
        </span>
      </div>
    </button>
  );
}
