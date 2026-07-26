import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Inbox, FilePlus, Send, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function InboxPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ ready_jobs: [], draft_invoices: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selJobs, setSelJobs] = useState(new Set());
  const [selDrafts, setSelDrafts] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [subjectPrefix, setSubjectPrefix] = useState("");
  const [report, setReport] = useState(null);

  const load = () => {
    setLoading(true);
    return api
      .get("/dashboard/inbox")
      .then((r) => {
        setData(r.data);
        setSelJobs(new Set());
        setSelDrafts(new Set());
      })
      .catch((e) => setErr(errMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const toggleJob = (id) =>
    setSelJobs((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleDraft = (id) =>
    setSelDrafts((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAllJobs = () =>
    setSelJobs(
      (data.ready_jobs.length === selJobs.size && selJobs.size > 0)
        ? new Set()
        : new Set(data.ready_jobs.map((j) => j.id))
    );
  const toggleAllDrafts = () =>
    setSelDrafts(
      (data.draft_invoices.length === selDrafts.size && selDrafts.size > 0)
        ? new Set()
        : new Set(data.draft_invoices.map((i) => i.id))
    );

  const onGenerate = async () => {
    if (selJobs.size === 0) return;
    setBusy(true);
    try {
      const { data: res } = await api.post("/invoices/bulk-generate", {
        job_ids: Array.from(selJobs),
      });
      toast.success(`${res.created} draft${res.created === 1 ? "" : "s"} generated.`);
      if (res.skipped) toast.message(`${res.skipped} skipped.`);
      await load();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onBulkSend = async () => {
    setBusy(true);
    setSendOpen(false);
    try {
      const { data: res } = await api.post("/invoices/bulk-send", {
        invoice_ids: Array.from(selDrafts),
        subject_prefix: subjectPrefix || null,
      });
      setReport(res);
      toast.success(`Sent ${res.sent} of ${res.sent + res.failed}.`);
      await load();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const draftsHaveRecipients = useMemo(() => {
    return Array.from(selDrafts).every(
      (id) => data.draft_invoices.find((i) => i.id === id)?.recipient_email
    );
  }, [selDrafts, data.draft_invoices]);

  return (
    <AppShell title="Inbox">
      {err && (
        <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>
      )}

      {!loading && data.ready_jobs.length === 0 && data.draft_invoices.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-lg p-10 text-center" data-testid="inbox-empty">
          <Inbox className="h-10 w-10 mx-auto text-stone-300 mb-3" strokeWidth={1.5} />
          <div className="text-[20px] font-semibold text-[#1F2937] mb-1">Inbox zero.</div>
          <p className="text-stone-600 max-w-md mx-auto">
            Nothing waiting on you right now. When you mark a job Completed or create a Draft invoice, it'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: Ready to invoice */}
          <section className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden" data-testid="inbox-ready-jobs">
            <header className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[15px] font-semibold text-[#1F2937]">Ready to invoice</div>
                <div className="text-xs text-stone-500 mt-0.5">
                  Completed jobs without an invoice · {data.ready_jobs.length} total
                </div>
              </div>
              {data.ready_jobs.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500" data-testid="ready-selected-count">
                    {selJobs.size > 0 ? `${selJobs.size} selected` : ""}
                  </span>
                  <Button
                    size="sm"
                    disabled={selJobs.size === 0 || busy}
                    onClick={onGenerate}
                    className="bg-[#1F2937] hover:bg-[#111827] text-white"
                    data-testid="ready-generate-btn"
                  >
                    <FilePlus className="h-3.5 w-3.5 mr-1.5" />
                    Generate {selJobs.size || ""} draft{selJobs.size === 1 ? "" : "s"}
                  </Button>
                </div>
              )}
            </header>
            {data.ready_jobs.length === 0 ? (
              <div className="px-5 py-10 text-center text-stone-500">
                <CheckCircle2 className="h-5 w-5 inline-block mr-1.5 text-emerald-600" strokeWidth={1.5} />
                Caught up — every completed job has an invoice.
              </div>
            ) : (
              <table className="sd-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        checked={selJobs.size === data.ready_jobs.length && selJobs.size > 0}
                        onChange={toggleAllJobs}
                        data-testid="ready-select-all"
                      />
                    </th>
                    <th>Date</th>
                    <th>Case / Witness</th>
                    <th>Client</th>
                    <th>Rate hint</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.ready_jobs.map((j) => {
                    const r = j.client_rates || {};
                    const hint = [
                      r.original_per_page && `Orig $${r.original_per_page}/pg`,
                      r.copy_per_page && `Copy $${r.copy_per_page}/pg`,
                      r.appearance_fee && `App $${r.appearance_fee}`,
                    ].filter(Boolean).join(" · ");
                    return (
                      <tr key={j.id} data-testid={`ready-job-row-${j.id}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selJobs.has(j.id)}
                            onChange={() => toggleJob(j.id)}
                            data-testid={`ready-job-checkbox-${j.id}`}
                          />
                        </td>
                        <td className="tabular text-stone-600">{fmtDate(j.job_date)}</td>
                        <td>
                          <div className="font-medium text-[#1F2937]">{j.case_caption || j.witness}</div>
                          {j.case_caption && j.witness && (
                            <div className="text-xs text-stone-500">Witness: {j.witness}</div>
                          )}
                        </td>
                        <td className="text-stone-600">{j.client_name || "—"}</td>
                        <td className="text-xs text-stone-500">{hint || <span className="text-stone-400">No defaults</span>}</td>
                        <td className="text-right">
                          <Link to={`/app/invoices/new?job_id=${j.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2" data-testid={`ready-job-invoice-${j.id}`}>
                              Invoice now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* SECTION 2: Drafts ready to send */}
          <section className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden" data-testid="inbox-draft-invoices">
            <header className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[15px] font-semibold text-[#1F2937]">Drafts ready to send</div>
                <div className="text-xs text-stone-500 mt-0.5">
                  Draft invoices with a billing email on file · {data.draft_invoices.length} total
                </div>
              </div>
              {data.draft_invoices.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500" data-testid="drafts-selected-count">
                    {selDrafts.size > 0 ? `${selDrafts.size} selected` : ""}
                  </span>
                  <Button
                    size="sm"
                    disabled={selDrafts.size === 0 || !draftsHaveRecipients || busy}
                    onClick={() => setSendOpen(true)}
                    className="bg-[#1F2937] hover:bg-[#111827] text-white"
                    data-testid="drafts-send-btn"
                    title={!draftsHaveRecipients ? "One of the selected invoices has no recipient email." : ""}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send {selDrafts.size || ""} invoice{selDrafts.size === 1 ? "" : "s"}
                  </Button>
                </div>
              )}
            </header>
            {data.draft_invoices.length === 0 ? (
              <div className="px-5 py-10 text-center text-stone-500">
                No drafts waiting to send.
              </div>
            ) : (
              <table className="sd-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        checked={selDrafts.size === data.draft_invoices.length && selDrafts.size > 0}
                        onChange={toggleAllDrafts}
                        data-testid="drafts-select-all"
                      />
                    </th>
                    <th>#</th>
                    <th>Client</th>
                    <th>Goes to</th>
                    <th className="!text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.draft_invoices.map((i) => (
                    <tr key={i.id} data-testid={`draft-row-${i.id}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selDrafts.has(i.id)}
                          onChange={() => toggleDraft(i.id)}
                          disabled={!i.recipient_email}
                          data-testid={`draft-checkbox-${i.id}`}
                        />
                      </td>
                      <td className="tabular font-medium">{i.invoice_number}</td>
                      <td className="text-stone-600">{i.client_name || "—"}</td>
                      <td className="text-xs text-stone-600">
                        {i.recipient_email ? (
                          <>
                            <div>{i.recipient_email}</div>
                            {i.recipient_name && <div className="text-stone-400">{i.recipient_name}</div>}
                          </>
                        ) : (
                          <span className="text-amber-700 inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Add a billing email
                          </span>
                        )}
                      </td>
                      <td className="text-right tabular font-medium">{fmt(i.total)}</td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => navigate(`/app/invoices/${i.id}`)}
                          data-testid={`draft-review-${i.id}`}
                        >
                          Review <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {/* Bulk send confirmation */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md" data-testid="bulk-send-dialog">
          <DialogHeader>
            <DialogTitle>Send {selDrafts.size} invoice{selDrafts.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              Each invoice goes to its own recipient with the PDF attached. Status flips to Sent automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-stone-500 font-semibold block mb-1.5">
                Optional subject prefix
              </label>
              <Input
                value={subjectPrefix}
                onChange={(e) => setSubjectPrefix(e.target.value)}
                placeholder="e.g. [Marie Chen]"
                data-testid="bulk-send-prefix"
              />
              <div className="text-xs text-stone-500 mt-1.5">
                Each subject reads: <span className="text-[#1F2937]">{subjectPrefix && `${subjectPrefix} `}Invoice SD-XXXX</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button
              onClick={onBulkSend}
              disabled={busy}
              className="bg-[#1F2937] hover:bg-[#111827] text-white"
              data-testid="bulk-send-confirm"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {busy ? "Sending…" : `Send ${selDrafts.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-invoice send report */}
      <Dialog open={!!report} onOpenChange={(o) => !o && setReport(null)}>
        <DialogContent className="max-w-lg" data-testid="bulk-send-report">
          <DialogHeader>
            <DialogTitle>Send report</DialogTitle>
            <DialogDescription>
              {report?.sent || 0} sent · {report?.failed || 0} failed
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {(report?.results || []).map((r, i) => (
              <li
                key={i}
                className={`text-sm px-3 py-2 rounded border ${r.ok ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-800"}`}
              >
                <div className="font-medium">
                  {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" /> : <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />}
                  {r.invoice_number || r.invoice_id}
                </div>
                {r.ok ? (
                  <div className="text-xs">→ {r.to_email}</div>
                ) : (
                  <div className="text-xs">{r.reason}</div>
                )}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button onClick={() => setReport(null)} className="bg-[#1F2937] hover:bg-[#111827] text-white">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
