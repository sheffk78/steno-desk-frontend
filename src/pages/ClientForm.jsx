import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
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
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function ClientForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [c, setC] = useState({
    name: "",
    type: "Agency",
    contact_name: "",
    contact_email: "",
    billing_address: "",
    phone: "",
    notes: "",
    rates: {
      original_per_page: "",
      copy_per_page: "",
      appearance_fee: "",
      appearance_hourly: "",
      rough_draft_per_page: "",
      rough_draft_flat: "",
      realtime_fee: "",
      read_sign_fee: "",
    },
  });
  const [err, setErr] = useState({});
  const [globalErr, setGlobalErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get(`/clients/${id}`).then((r) => {
        const d = r.data;
        setC({
          ...d,
          rates: {
            original_per_page: d.rates?.original_per_page ?? "",
            copy_per_page: d.rates?.copy_per_page ?? "",
            appearance_fee: d.rates?.appearance_fee ?? "",
            appearance_hourly: d.rates?.appearance_hourly ?? "",
            rough_draft_per_page: d.rates?.rough_draft_per_page ?? "",
            rough_draft_flat: d.rates?.rough_draft_flat ?? "",
            realtime_fee: d.rates?.realtime_fee ?? "",
            read_sign_fee: d.rates?.read_sign_fee ?? "",
          },
        });
      }).catch((e) => setGlobalErr(errMessage(e)));
    }
  }, [editing, id]);

  const setF = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const setRate = (k, v) => setC((p) => ({ ...p, rates: { ...p.rates, [k]: v } }));

  const onSave = async () => {
    if (!c.name.trim()) {
      setErr({ name: "Please add a client name." });
      return;
    }
    setErr({});
    setSaving(true);
    setGlobalErr("");
    try {
      const payload = {
        ...c,
        contact_email: c.contact_email || null,
        rates: Object.fromEntries(
          Object.entries(c.rates).map(([k, v]) => [k, v === "" || v === null ? null : parseFloat(v)])
        ),
      };
      let saved;
      if (editing) {
        saved = (await api.put(`/clients/${id}`, payload)).data;
        toast.success("Client updated.");
      } else {
        saved = (await api.post("/clients", payload)).data;
        toast.success(`${saved.name} added.`);
      }
      navigate(`/app/clients/${saved.id}`);
    } catch (e) {
      setGlobalErr(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    if (!window.confirm("Delete this client? Jobs and invoices stay on file.")) return;
    await api.delete(`/clients/${id}`);
    toast.success("Client deleted.");
    navigate("/app/clients");
  };

  return (
    <AppShell
      title={editing ? "Edit client" : "Add client"}
      actions={
        <Link to="/app/clients">
          <Button variant="outline" className="border-stone-300" data-testid="client-back">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to clients
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl bg-white border border-stone-200 rounded-md p-6">
        {globalErr && <div className="mb-5 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{globalErr}</div>}

        <Section title="Contact">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *" error={err.name}>
              <Input value={c.name} onChange={(e) => setF("name", e.target.value)} data-testid="client-name" />
            </Field>
            <Field label="Type">
              <Select value={c.type} onValueChange={(v) => setF("type", v)}>
                <SelectTrigger data-testid="client-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agency">Agency</SelectItem>
                  <SelectItem value="Law Firm">Law Firm</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Contact name">
              <Input value={c.contact_name || ""} onChange={(e) => setF("contact_name", e.target.value)} data-testid="client-contact" />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={c.contact_email || ""} onChange={(e) => setF("contact_email", e.target.value)} data-testid="client-email" />
            </Field>
            <Field label="Phone">
              <Input value={c.phone || ""} onChange={(e) => setF("phone", e.target.value)} data-testid="client-phone" />
            </Field>
          </div>
          <Field label="Billing address">
            <Textarea value={c.billing_address || ""} onChange={(e) => setF("billing_address", e.target.value)} rows={3} data-testid="client-address" />
          </Field>
        </Section>

        <Section title="Default rates (optional, auto-fill on invoices)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Original transcript ($/page)">
              <Input type="number" step="0.01" value={c.rates.original_per_page} onChange={(e) => setRate("original_per_page", e.target.value)} data-testid="client-rate-original" />
            </Field>
            <Field label="Copy ($/page)">
              <Input type="number" step="0.01" value={c.rates.copy_per_page} onChange={(e) => setRate("copy_per_page", e.target.value)} data-testid="client-rate-copy" />
            </Field>
            <Field label="Appearance fee (flat)">
              <Input type="number" step="0.01" value={c.rates.appearance_fee} onChange={(e) => setRate("appearance_fee", e.target.value)} data-testid="client-rate-appearance" />
            </Field>
            <Field label="Appearance hourly ($/hr)">
              <Input type="number" step="0.01" value={c.rates.appearance_hourly} onChange={(e) => setRate("appearance_hourly", e.target.value)} />
            </Field>
            <Field label="Rough draft ($/page)">
              <Input type="number" step="0.01" value={c.rates.rough_draft_per_page} onChange={(e) => setRate("rough_draft_per_page", e.target.value)} />
            </Field>
            <Field label="Rough draft (flat)">
              <Input type="number" step="0.01" value={c.rates.rough_draft_flat} onChange={(e) => setRate("rough_draft_flat", e.target.value)} data-testid="client-rate-rough-flat" />
            </Field>
            <Field label="Realtime feed (flat)">
              <Input type="number" step="0.01" value={c.rates.realtime_fee} onChange={(e) => setRate("realtime_fee", e.target.value)} />
            </Field>
            <Field label="Read & sign (flat)">
              <Input type="number" step="0.01" value={c.rates.read_sign_fee} onChange={(e) => setRate("read_sign_fee", e.target.value)} data-testid="client-rate-read-sign" />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <Textarea value={c.notes || ""} onChange={(e) => setF("notes", e.target.value)} rows={3} data-testid="client-notes" />
        </Section>

        <div className="mt-6 pt-5 border-t border-stone-200 flex items-center justify-between">
          <div>
            {editing && (
              <Button variant="ghost" onClick={onDelete} className="text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete client
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/app/clients"><Button variant="outline" className="border-stone-300">Cancel</Button></Link>
            <Button onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="client-save">
              {saving ? "Saving…" : (editing ? "Save changes" : "Add client")}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-3">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, error, children }) {
  return (
    <div>
      <Label className="block mb-1.5">{label}</Label>
      {children}
      {error && <div className="text-xs text-red-700 mt-1">{error}</div>}
    </div>
  );
}
