import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";

const JOB_TYPES = ["Deposition", "EBT", "Arbitration", "Hearing", "Other"];
const STATUSES = ["Scheduled", "Completed", "Invoiced", "Paid"];

export default function JobForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [attorneys, setAttorneys] = useState([]);
  const [scopists, setScopists] = useState([]);
  const [job, setJob] = useState({
    case_caption: "",
    case_number: "",
    witness: "",
    job_date: new Date().toISOString().slice(0, 10),
    start_time: "",
    location: "",
    job_type: "Deposition",
    client_id: "",
    ordering_attorney_id: "",
    ordering_attorney_text: "",
    opposing_attorney_text: "",
    status: "Scheduled",
    notes: "",
    scopist_id: "",
    scopist_status: null,
  });
  const [err, setErr] = useState({});
  const [globalErr, setGlobalErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
    api.get("/scopists").then((r) => setScopists(r.data)).catch(() => {});
    if (editing) {
      api.get(`/jobs/${id}`).then((r) => setJob({ ...job, ...r.data })).catch((e) => setGlobalErr(errMessage(e)));
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (job.client_id) {
      api.get("/attorneys", { params: { client_id: job.client_id } }).then((r) => setAttorneys(r.data));
    } else {
      setAttorneys([]);
    }
  }, [job.client_id]);

  const set = (k, v) => setJob((j) => ({ ...j, [k]: v }));

  const validate = () => {
    const e = {};
    if (!job.witness?.trim()) e.witness = "Please add the witness name.";
    if (!job.job_date) e.job_date = "Please pick a job date.";
    if (!job.client_id) e.client_id = "Please choose a client.";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setGlobalErr("");
    try {
      const payload = {
        ...job,
        ordering_attorney_id: job.ordering_attorney_id || null,
        scopist_id: job.scopist_id || null,
        scopist_status: job.scopist_id ? (job.scopist_status || "Assigned") : null,
        start_time: job.start_time || null,
      };
      Object.keys(payload).forEach((k) => payload[k] === "" && (payload[k] = null));
      payload.witness = job.witness; // ensure required
      payload.client_id = job.client_id;
      payload.job_date = job.job_date;
      payload.status = job.status;
      payload.job_type = job.job_type;

      let saved;
      if (editing) {
        saved = (await api.put(`/jobs/${id}`, payload)).data;
        toast.success("Job updated.");
      } else {
        saved = (await api.post("/jobs", payload)).data;
        toast.success("Job logged.");
      }
      navigate(`/app/jobs/${saved.id}`);
      setJob({ ...job, ...saved });
    } catch (e) {
      setGlobalErr(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    if (!window.confirm("Delete this job? This can't be undone.")) return;
    await api.delete(`/jobs/${id}`);
    toast.success("Job deleted.");
    navigate("/app/jobs");
  };

  const onCreateInvoice = () => {
    navigate(`/app/invoices/new?job_id=${id}`);
  };

  const selectedClient = clients.find((c) => c.id === job.client_id);

  return (
    <AppShell
      title={editing ? "Edit job" : "New job"}
      actions={
        <>
          <Link to="/app/jobs">
            <Button variant="outline" className="border-stone-300" data-testid="job-back">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to jobs
            </Button>
          </Link>
          {editing && (
            <Button onClick={onCreateInvoice} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="job-create-invoice">
              <FileText className="h-4 w-4 mr-1.5" /> Create invoice
            </Button>
          )}
        </>
      }
    >
      <div className="max-w-3xl bg-white border border-stone-200 rounded-md p-6">
        {globalErr && (
          <div className="mb-5 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{globalErr}</div>
        )}

        <Section title="Case">
          <Field label="Case caption" error={err.case_caption}>
            <Input value={job.case_caption || ""} onChange={(e) => set("case_caption", e.target.value)} placeholder="Hartwell v. Mesa Logistics" data-testid="job-case-caption" />
          </Field>
          <Field label="Case number" error={err.case_number}>
            <Input value={job.case_number || ""} onChange={(e) => set("case_number", e.target.value)} placeholder="CV-2024-031847" data-testid="job-case-number" />
          </Field>
        </Section>

        <Section title="Witness & venue">
          <Field label="Witness *" error={err.witness}>
            <Input value={job.witness || ""} onChange={(e) => set("witness", e.target.value)} data-testid="job-witness" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Job date *" error={err.job_date}>
              <DatePicker value={job.job_date || ""} onChange={(v) => set("job_date", v)} placeholder="Pick a date" clearable={false} data-testid="job-date" />
            </Field>
            <Field label="Start time">
              <Input type="time" value={job.start_time || ""} onChange={(e) => set("start_time", e.target.value)} data-testid="job-time" />
            </Field>
          </div>
          <Field label="Location / venue">
            <Input value={job.location || ""} onChange={(e) => set("location", e.target.value)} placeholder="Snell & Wilmer, Phoenix" data-testid="job-location" />
          </Field>
          <Field label="Job type">
            <Select value={job.job_type} onValueChange={(v) => set("job_type", v)}>
              <SelectTrigger data-testid="job-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Parties">
          <Field label="Client *" error={err.client_id}>
            {clients.length === 0 ? (
              <div className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded px-3 py-2">
                You don't have any clients yet.{" "}
                <Link to="/app/clients/new" className="underline">Add one first.</Link>
              </div>
            ) : (
              <Select value={job.client_id} onValueChange={(v) => set("client_id", v)}>
                <SelectTrigger data-testid="job-client"><SelectValue placeholder="Choose a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </Field>
          {selectedClient && (selectedClient.rates?.original_per_page || selectedClient.rates?.copy_per_page) && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 -mt-2">
              Default rates on file for {selectedClient.name} — they'll auto-fill the invoice.
            </div>
          )}
          <Field label="Ordering attorney">
            {attorneys.length > 0 ? (
              <Select value={job.ordering_attorney_id || ""} onValueChange={(v) => set("ordering_attorney_id", v)}>
                <SelectTrigger data-testid="job-ordering-attorney"><SelectValue placeholder="Choose an attorney" /></SelectTrigger>
                <SelectContent>
                  {attorneys.map((a) => <SelectItem key={a.id} value={a.id}>{a.first_name} {a.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={job.ordering_attorney_text || ""} onChange={(e) => set("ordering_attorney_text", e.target.value)} placeholder="First Last" data-testid="job-ordering-text" />
            )}
          </Field>
          <Field label="Opposing attorney (optional)">
            <Input value={job.opposing_attorney_text || ""} onChange={(e) => set("opposing_attorney_text", e.target.value)} data-testid="job-opposing-text" />
          </Field>
          <Field label="Scopist (optional)">
            {scopists.length === 0 ? (
              <div className="text-sm text-stone-500">
                No scopists yet. <Link to="/app/scopists" className="underline">Add a scopist</Link> to assign.
              </div>
            ) : (
              <Select value={job.scopist_id || "__none__"} onValueChange={(v) => set("scopist_id", v === "__none__" ? "" : v)}>
                <SelectTrigger data-testid="job-scopist"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unassigned —</SelectItem>
                  {scopists.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {editing && job.scopist_id && job.scopist_status && (
              <div className="text-xs text-stone-500 mt-1">
                Scoping status: <span className="font-medium text-[#1F2937]">{job.scopist_status}</span>
              </div>
            )}
          </Field>
        </Section>

        <Section title="Status & notes">
          <Field label="Status">
            <Select value={job.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger data-testid="job-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea value={job.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} data-testid="job-notes" />
          </Field>
        </Section>

        <div className="mt-6 pt-5 border-t border-stone-200 flex items-center justify-between">
          <div>
            {editing && (
              <Button variant="ghost" onClick={onDelete} className="text-red-700 hover:bg-red-50" data-testid="job-delete">
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete job
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/app/jobs"><Button variant="outline" className="border-stone-300">Cancel</Button></Link>
            <Button disabled={saving} onClick={onSave} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="job-save">
              {saving ? "Saving…" : (editing ? "Save changes" : "Save job")}
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
