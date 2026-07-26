import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/pages/Dashboard";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [attorneys, setAttorneys] = useState([]);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  const reload = async () => {
    try {
      const [cr, jr, ar] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/jobs`),
        api.get(`/attorneys`, { params: { client_id: id } }),
      ]);
      setC(cr.data);
      setJobs(jr.data.filter((j) => j.client_id === id));
      setAttorneys(ar.data);
    } catch (e) {
      setErr(errMessage(e));
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id]);

  if (err) return <AppShell title="Client"><div className="bg-red-50 border border-red-200 text-red-800 rounded px-4 py-3">{err}</div></AppShell>;
  if (!c) return <AppShell title="Client"><div /></AppShell>;

  const removeAttorney = async (aid) => {
    if (!window.confirm("Remove this attorney?")) return;
    await api.delete(`/attorneys/${aid}`);
    reload();
  };

  return (
    <AppShell
      title={c.name}
      actions={
        <>
          <Link to="/app/clients">
            <Button variant="outline" className="border-stone-300"><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
          </Link>
          <Link to={`/app/clients/${id}/edit`}>
            <Button variant="outline" className="border-stone-300" data-testid="client-edit">
              <Pencil className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-stone-200 rounded-md p-5">
          <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-3">Contact</div>
          <div className="text-sm space-y-1">
            <div className="font-medium text-slate-900">{c.name}</div>
            <div className="text-stone-600">{c.type}</div>
            {c.contact_name && <div className="text-stone-700">Attn: {c.contact_name}</div>}
            {c.contact_email && <div className="text-stone-700">{c.contact_email}</div>}
            {c.phone && <div className="text-stone-700">{c.phone}</div>}
            {c.billing_address && <div className="text-stone-700 whitespace-pre-line">{c.billing_address}</div>}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-5">
          <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-3">Default rates</div>
          {c.rates && (c.rates.original_per_page || c.rates.copy_per_page || c.rates.appearance_fee || c.rates.appearance_hourly || c.rates.rough_draft_per_page || c.rates.rough_draft_flat || c.rates.realtime_fee || c.rates.read_sign_fee) ? (
            <div className="text-sm space-y-1.5">
              {c.rates.original_per_page != null && <RateRow label="Original transcript" value={`$${c.rates.original_per_page.toFixed(2)}/pg`} />}
              {c.rates.copy_per_page != null && <RateRow label="Copy" value={`$${c.rates.copy_per_page.toFixed(2)}/pg`} />}
              {c.rates.appearance_fee != null && <RateRow label="Appearance fee" value={`$${c.rates.appearance_fee.toFixed(2)}`} />}
              {c.rates.appearance_hourly != null && <RateRow label="Appearance hourly" value={`$${c.rates.appearance_hourly.toFixed(2)}/hr`} />}
              {c.rates.rough_draft_per_page != null && <RateRow label="Rough draft" value={`$${c.rates.rough_draft_per_page.toFixed(2)}/pg`} />}
              {c.rates.rough_draft_flat != null && <RateRow label="Rough draft (flat)" value={`$${c.rates.rough_draft_flat.toFixed(2)}`} />}
              {c.rates.realtime_fee != null && <RateRow label="Realtime feed" value={`$${c.rates.realtime_fee.toFixed(2)}`} />}
              {c.rates.read_sign_fee != null && <RateRow label="Read & sign" value={`$${c.rates.read_sign_fee.toFixed(2)}`} />}
            </div>
          ) : (
            <p className="text-sm text-stone-500">No default rates set yet — <Link to={`/app/clients/${id}/edit`} className="underline">add some</Link> to auto-fill invoices.</p>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500">Attorneys</div>
            <Button size="sm" variant="outline" className="border-stone-300 h-7" onClick={() => setOpen(true)} data-testid="client-add-attorney">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {attorneys.length === 0 ? (
            <p className="text-sm text-stone-500">No attorneys yet.</p>
          ) : (
            <ul className="space-y-2">
              {attorneys.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-slate-900">{a.first_name} {a.last_name}</div>
                    {a.email && <div className="text-stone-500 text-xs">{a.email}</div>}
                    {a.phone && <div className="text-stone-500 text-xs">{a.phone}</div>}
                  </div>
                  <button onClick={() => removeAttorney(a.id)} className="text-stone-400 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white border border-stone-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 text-sm font-medium text-slate-900">Jobs</div>
        {jobs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-stone-500">No jobs yet for this client.</div>
        ) : (
          <table className="w-full sd-table">
            <thead><tr><th>Date</th><th>Witness</th><th>Case</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} onClick={() => navigate(`/app/jobs/${j.id}`)} className="cursor-pointer">
                  <td className="font-mono text-xs">{j.job_date}</td>
                  <td>{j.witness}</td>
                  <td>{j.case_caption || "—"}</td>
                  <td>{j.job_type}</td>
                  <td><StatusPill status={j.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddAttorneyDialog open={open} onClose={() => setOpen(false)} clientId={id} onAdded={reload} />
    </AppShell>
  );
}

function RateRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 pb-1">
      <span className="text-stone-600">{label}</span>
      <span className="font-mono text-slate-900">{value}</span>
    </div>
  );
}

function AddAttorneyDialog({ open, onClose, clientId, onAdded }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setFirst(""); setLast(""); setEmail(""); setPhone(""); setErr(""); }
  }, [open]);

  const onSave = async () => {
    if (!first.trim() || !last.trim()) return setErr("Please enter a first and last name.");
    setSaving(true);
    try {
      await api.post("/attorneys", {
        first_name: first,
        last_name: last,
        email: email || null,
        phone: phone || null,
        client_id: clientId,
      });
      toast.success("Attorney added.");
      onAdded();
      onClose();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-serif">Add attorney</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block mb-1.5">First name</Label>
              <Input value={first} onChange={(e) => setFirst(e.target.value)} data-testid="atty-first" />
            </div>
            <div>
              <Label className="block mb-1.5">Last name</Label>
              <Input value={last} onChange={(e) => setLast(e.target.value)} data-testid="atty-last" />
            </div>
          </div>
          <div>
            <Label className="block mb-1.5">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="atty-email" />
          </div>
          <div>
            <Label className="block mb-1.5">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0142" data-testid="atty-phone" />
          </div>
          {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-stone-300" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="atty-save">
            {saving ? "Adding…" : "Add attorney"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
