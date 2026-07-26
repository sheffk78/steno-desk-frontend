import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, errMessage, API } from "@/lib/api";
import useLetterheadBlob from "@/hooks/useLetterheadBlob";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import BillingPanel from "@/components/BillingPanel";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "invoice", label: "Invoice & letterhead" },
  { id: "subscription", label: "Subscription" },
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function SettingsPage() {
  const { user, updateSettings } = useAuth();
  const [params] = useSearchParams();
  // Honor ?tab=subscription deep-link from TrialBanner / 402 toast.
  const initialTab = TABS.some((t) => t.id === params.get("tab"))
    ? params.get("tab")
    : "profile";
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({
    name: "",
    business_name: "",
    cert_number: "",
    cert_type: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    default_net_days: 30,
    invoice_prefix: "SD",
    payment_instructions_default: "",
    auto_reminders_enabled: true,
    notify_on_open: true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        business_name: user.business_name || "",
        cert_number: user.cert_number || "",
        cert_type: user.cert_type || "",
        address_line1: user.address_line1 || "",
        address_line2: user.address_line2 || "",
        city: user.city || "",
        state: user.state || "",
        zip: user.zip || "",
        phone: user.phone || "",
        default_net_days: user.default_net_days ?? 30,
        invoice_prefix: user.invoice_prefix || "SD",
        payment_instructions_default: user.payment_instructions_default || "",
        auto_reminders_enabled: user.auto_reminders_enabled !== false,
        notify_on_open: user.notify_on_open !== false,
      });
    }
  }, [user]);

  const onSave = async () => {
    setSaving(true);
    setErr("");
    try {
      await updateSettings({
        ...form,
        default_net_days: parseInt(form.default_net_days || 30, 10),
        invoice_prefix: (form.invoice_prefix || "SD").toUpperCase().slice(0, 6),
      });
      toast.success("Saved.");
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Settings">
      <div className="flex gap-2 border-b border-[#E5E1DA] mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`settings-tab-${t.id}`}
            className={`px-4 py-2.5 text-[15px] -mb-px border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#1F2937] text-[#1F2937] font-semibold"
                : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="max-w-3xl bg-white border border-[#E5E1DA] rounded-lg p-7">
          <SectionTitle>Reporter info (appears on every invoice)</SectionTitle>
          <Grid2>
            <Field label="Full name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Marie Chen" data-testid="settings-name" />
            </Field>
            <Field label="Business name (optional)">
              <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Marie Chen Court Reporting" data-testid="settings-business" />
            </Field>
            <Field label="Certification number">
              <Input value={form.cert_number} onChange={(e) => setForm({ ...form, cert_number: e.target.value })} placeholder="AZ-CR-2018-0147" data-testid="settings-cert" />
            </Field>
            <Field label="Certification type">
              <Input value={form.cert_type} onChange={(e) => setForm({ ...form, cert_type: e.target.value })} placeholder="RPR, CRR, CCR…" data-testid="settings-cert-type" />
            </Field>
          </Grid2>

          <SectionTitle className="mt-8">Mailing address</SectionTitle>
          <Field label="Address line 1">
            <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} data-testid="settings-addr1" />
          </Field>
          <Field label="Address line 2 (optional)">
            <Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} data-testid="settings-addr2" />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Field label="City">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="settings-city" />
              </Field>
            </div>
            <Field label="State">
              <Select value={form.state || "_"} onValueChange={(v) => setForm({ ...form, state: v === "_" ? "" : v })}>
                <SelectTrigger data-testid="settings-state"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="_">—</SelectItem>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="ZIP">
              <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} data-testid="settings-zip" />
            </Field>
          </div>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="settings-phone" />
          </Field>

          <SectionTitle className="mt-8">Notifications & automation</SectionTitle>
          <ToggleRow
            label="Automatic overdue reminders"
            hint="When an invoice is more than 7 days past due, Steno Desk sends a polite reminder with the invoice re-attached. Up to 3 reminders per invoice (at 7, 14, and 30 days past due)."
            value={form.auto_reminders_enabled}
            onChange={(v) => setForm({ ...form, auto_reminders_enabled: v })}
            testId="settings-auto-reminders"
          />
          <ToggleRow
            label="Email me when a client opens an invoice"
            hint="You'll get a one-time email the first time each client opens an invoice you've sent — handy for knowing when to follow up."
            value={form.notify_on_open}
            onChange={(v) => setForm({ ...form, notify_on_open: v })}
            testId="settings-notify-on-open"
          />

          {err && <Err text={err} />}
          <div className="mt-7 pt-5 border-t border-[#E5E1DA] flex justify-end">
            <Button onClick={onSave} disabled={saving} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="settings-save-profile">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {tab === "invoice" && (
        <div className="max-w-3xl bg-white border border-[#E5E1DA] rounded-lg p-7">
          <SectionTitle>Invoice defaults</SectionTitle>
          <Grid2>
            <Field
              label="Invoice number prefix"
              hint={`Next invoice will look like “${(form.invoice_prefix || "SD").toUpperCase()}-0042”.`}
            >
              <Input
                value={form.invoice_prefix}
                onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value.toUpperCase() })}
                maxLength={6}
                data-testid="settings-prefix"
              />
            </Field>
            <Field label="Default payment terms (net days)">
              <Input
                type="number"
                min={0}
                max={120}
                value={form.default_net_days}
                onChange={(e) => setForm({ ...form, default_net_days: e.target.value })}
                data-testid="settings-net-days"
              />
            </Field>
          </Grid2>
          <Field label="Default payment instructions (printed on every invoice)">
            <Textarea
              rows={3}
              value={form.payment_instructions_default}
              onChange={(e) => setForm({ ...form, payment_instructions_default: e.target.value })}
              placeholder="Make checks payable to ___. Mail to ___. ACH details on request."
              data-testid="settings-payment-instructions"
            />
          </Field>

          <div className="mt-6 pt-5 border-t border-[#E5E1DA]">
            <SectionTitle>Letterhead / logo</SectionTitle>
            <LetterheadUploader />
          </div>

          {err && <Err text={err} />}
          <div className="mt-7 pt-5 border-t border-[#E5E1DA] flex justify-end">
            <Button onClick={onSave} disabled={saving} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="settings-save-invoice">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {tab === "subscription" && (
        <div className="max-w-3xl bg-white border border-[#E5E1DA] rounded-lg p-7">
          <SectionTitle>Subscription</SectionTitle>
          <BillingPanel />
        </div>
      )}

      <div className="max-w-3xl mt-5 bg-white border border-[#E5E1DA] rounded-lg p-6">
        <SectionTitle>Account</SectionTitle>
        <div className="text-[15px] space-y-1">
          <div><span className="text-[#6B7280]">Email: </span><span>{user?.email}</span></div>
          <div><span className="text-[#6B7280]">Trial ends: </span><span>{user?.trial_ends_at?.slice(0, 10) || "—"}</span></div>
          <div><span className="text-[#6B7280]">Member since: </span><span>{user?.created_at?.slice(0, 10) || "—"}</span></div>
        </div>
      </div>
    </AppShell>
  );
}

const SectionTitle = ({ children, className = "" }) => (
  <div className={`text-[13px] tracking-[0.06em] uppercase text-[#6B7280] font-semibold mb-4 ${className}`}>{children}</div>
);
const Grid2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
const Field = ({ label, hint, children }) => (
  <div className="mb-4">
    <Label className="block mb-1.5 text-[14px] font-semibold text-[#374151]">{label}</Label>
    {children}
    {hint && <div className="text-[13px] text-[#6B7280] mt-1.5">{hint}</div>}
  </div>
);
const Err = ({ text }) => (
  <div className="mt-4 text-[14px] bg-[#FEE2E2] border border-[#B91C1C]/30 text-[#B91C1C] rounded-md px-3 py-2">{text}</div>
);

/** ToggleRow — labelled on/off switch with a description.
 *  Used for opt-in/out toggles like "automatic reminders" and
 *  "notify me when a client opens an invoice".
 */
const ToggleRow = ({ label, hint, value, onChange, testId }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-[#F1EFE9] last:border-0">
    <div className="flex-1 min-w-0">
      <div className="text-[14px] text-[#1F2937] font-medium">{label}</div>
      {hint && <div className="text-[13px] text-[#6B7280] mt-0.5 leading-snug">{hint}</div>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={!!value}
      onClick={() => onChange(!value)}
      data-testid={testId}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        value ? "bg-[#1F2937]" : "bg-[#D6D3D1]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);
const PlanCard = ({ name, price, cadence, featured, note }) => (
  <div className={`p-5 border rounded-lg ${featured ? "border-[#D4A056] ring-1 ring-[#D4A056]/40 bg-[#FAF3E4]/30" : "border-[#E5E1DA]"}`}>
    <div className="text-[12px] tracking-[0.08em] uppercase text-[#6B7280] font-semibold mb-2">{name}</div>
    <div className="flex items-baseline gap-1.5 mb-2">
      <span className="text-[30px] font-semibold tabular">{price}</span>
      <span className="text-[15px] text-[#6B7280]">{cadence}</span>
    </div>
    {note && <div className="text-[13px] text-[#B45309] font-medium">{note}</div>}
  </div>
);

function LetterheadUploader() {
  const { user, refresh } = useAuth();
  const fileRef = useRef(null);
  const { blobUrl } = useLetterheadBlob(user?.letterhead_url, user?.letterhead_uploaded_at);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const hasLetterhead = Boolean(user?.letterhead_url);

  const onPick = () => fileRef.current?.click();

  const onChange = async (e) => {
    setErr("");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErr("Please use an image smaller than 2 MB.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(file.type)) {
      setErr("Please upload a PNG, JPG, or SVG image.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post("/uploads/letterhead", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refresh();
      toast.success("Letterhead saved. It'll appear on every invoice from now on.");
    } catch (ex) {
      setErr(errMessage(ex, "Couldn't upload that image."));
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!window.confirm("Remove your letterhead image? Invoices will fall back to your name and cert number.")) return;
    setBusy(true);
    try {
      await api.delete("/uploads/letterhead");
      await refresh();
      toast.success("Letterhead removed.");
    } catch (ex) {
      toast.error(errMessage(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="letterhead-uploader">
      <p className="text-[14px] text-[#6B7280] mb-4">
        Upload a small PNG, JPG, or SVG (max 2 MB). It'll appear at the top of
        every invoice you generate. SVG renders in the app preview only — the
        PDF uses the PNG/JPG version. We recommend a transparent PNG sized
        around 600×200 px.
      </p>

      <div className="flex items-center gap-5">
        <div
          className={`w-[200px] h-[80px] border ${
            hasLetterhead ? "border-[#E5E1DA]" : "border-dashed border-[#D6D3D1]"
          } rounded-md bg-white flex items-center justify-center overflow-hidden`}
          data-testid="letterhead-preview"
        >
          {blobUrl && user?.letterhead_url ? (
            <img
              key={user?.letterhead_uploaded_at || "empty"}
              src={blobUrl}
              alt="Letterhead"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="text-[12px] text-[#9CA3AF]">No letterhead yet</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={onPick}
            disabled={busy}
            className="bg-[#1F2937] hover:bg-[#111827] text-white h-9"
            data-testid="letterhead-upload-btn"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            {hasLetterhead ? "Replace image" : "Upload image"}
          </Button>
          {hasLetterhead && (
            <Button
              type="button"
              variant="outline"
              onClick={onRemove}
              disabled={busy}
              className="h-9 border-[#E5E1DA] text-[#B91C1C] hover:bg-[#FEE2E2]"
              data-testid="letterhead-remove-btn"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Remove
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={onChange}
          data-testid="letterhead-file-input"
        />
      </div>

      {err && (
        <div className="mt-3 text-[14px] bg-[#FEE2E2] border border-[#B91C1C]/30 text-[#B91C1C] rounded-md px-3 py-2">
          {err}
        </div>
      )}
    </div>
  );
}

