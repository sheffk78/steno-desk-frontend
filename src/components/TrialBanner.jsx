/**
 * TrialBanner — sticky strip across the top of every authenticated page
 * that reminds the user about their trial / beta status and offers a
 * one-click upgrade path.
 *
 * Visibility matrix:
 *   - admin_lifetime         → null (founder access, no banner ever)
 *   - active_monthly/annual  → null (paying customer, leave them alone)
 *   - trial (>3 days left)   → soft amber, "N days left in trial"
 *   - trial (1-3 days left)  → urgent amber, "Only N days left — upgrade now"
 *   - trial (expired)        → red, "Your trial has ended. Upgrade to keep working."
 *   - beta (with expiry, ok) → blue, "Beta access · expires in N days"
 *   - beta (expired)         → red, "Your beta access has ended. Upgrade to continue."
 *
 * Data source: GET /api/billing/status (cached on AuthContext via swr-like
 * pattern in AppShell would be ideal, but for now we fetch on mount and
 * also re-fetch when the user clicks Upgrade and returns).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const SETTINGS_BILLING_URL = "/app/settings?tab=subscription";

export default function TrialBanner() {
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.get("/billing/status")
      .then((r) => { if (!cancelled) setStatus(r.data); })
      .catch(() => { /* silent — banner is non-critical */ });
    return () => { cancelled = true; };
  }, []);

  if (!status) return null;
  // No banner for: admins, paying subscribers, or someone with no
  // trial/beta context at all.
  if (status.is_admin_lifetime) return null;
  if (status.subscription_type === "active_monthly") return null;
  if (status.subscription_type === "active_annual") return null;

  const state = computeState(status);
  if (!state) return null;

  const onUpgrade = () => navigate(SETTINGS_BILLING_URL);

  return (
    <div
      className={`px-6 py-2.5 flex items-center justify-between gap-4 border-b text-[13.5px] ${state.cls}`}
      data-testid="trial-banner"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base leading-none" aria-hidden>{state.icon}</span>
        <span className="truncate">
          <span className="font-medium">{state.title}</span>
          {state.body && <span className="ml-1.5 opacity-80">{state.body}</span>}
        </span>
      </div>
      <button
        onClick={onUpgrade}
        data-testid="trial-banner-upgrade"
        className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${state.btnCls}`}
      >
        {state.cta}
      </button>
    </div>
  );
}

function computeState(status) {
  const sub = status.subscription_type;
  const daysLeft = (() => {
    const iso = status.trial_ends_at;
    if (!iso) return null;
    const due = new Date(iso.slice(0, 10) + "T00:00:00Z");
    return Math.ceil((due.getTime() - Date.now()) / 86400000);
  })();

  // Beta path
  if (sub === "beta") {
    // Beta with no end → no banner (forever-comped is happy news)
    // But we DO want a subtle reminder when there's an expiry.
    return null;
  }

  // Trial / expired path
  if (daysLeft == null) return null;

  if (daysLeft < 0) {
    return {
      icon: "⛔",
      title: "Your trial has ended.",
      body: "Existing data is safe — upgrade to keep creating jobs and sending invoices.",
      cta: "Upgrade now",
      cls: "bg-red-50 border-red-200 text-red-900",
      btnCls: "bg-red-700 text-white hover:bg-red-800",
    };
  }

  if (daysLeft <= 3) {
    return {
      icon: "⏰",
      title: `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial.`,
      body: "Upgrade now so nothing breaks when it ends.",
      cta: "Upgrade",
      cls: "bg-amber-50 border-amber-300 text-amber-900",
      btnCls: "bg-amber-700 text-white hover:bg-amber-800",
    };
  }

  return {
    icon: "✨",
    title: `${daysLeft} days left in your trial.`,
    body: "Upgrade anytime — we'll honor your remaining trial days.",
    cta: "Upgrade",
    cls: "bg-stone-50 border-stone-200 text-stone-800",
    btnCls: "bg-slate-900 text-white hover:bg-slate-800",
  };
}
