import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { api, errMessage, API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import useLetterheadBlob from "@/hooks/useLetterheadBlob";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Download, Send, CheckCircle2, Ban, Link as LinkIcon, FileStack } from "lucide-react";
import { StatusPill } from "@/pages/Dashboard";
import DeliveryChip from "@/components/DeliveryChip";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);

// Court-reporter line item catalog
const LINE_TYPES = [
  { type: "appearance_fee", label: "Appearance fee", input: "flat" },
  { type: "original_transcript", label: "Original transcript", input: "pages" },
  { type: "copy", label: "Copy", input: "pages" },
  { type: "rough_draft", label: "Rough draft", input: "flat" },
  { type: "realtime", label: "Realtime feed", input: "flat" },
  { type: "expedite", label: "Expedite surcharge", input: "flat" },
  { type: "read_sign", label: "Read & sign", input: "flat" },
  { type: "exhibits", label: "Exhibits", input: "pages" },
  { type: "mileage", label: "Travel / mileage", input: "pages" },
  { type: "scopist_deduction", label: "Scopist deduction", input: "flat", negative: true },
  { type: "late_delivery", label: "Late delivery surcharge", input: "flat" },
  { type: "custom", label: "Custom line item", input: "flat" },
];

const newLine = (type) => {
  const meta = LINE_TYPES.find((l) => l.type === type) || LINE_TYPES[LINE_TYPES.length - 1];
  return {
    type: meta.type,
    label: meta.label,
    detail: "",
    quantity: meta.input === "pages" ? 0 : null,
    rate: meta.input === "pages" ? 0 : null,
    amount: 0,
  };
};

const defaultLinesFromClient = (client) => {
  const lines = [];
  const r = client?.rates || {};
  if (r.appearance_fee) {
    lines.push({ type: "appearance_fee", label: "Appearance fee", detail: "", quantity: null, rate: null, amount: r.appearance_fee });
  }
  if (r.original_per_page) {
    lines.push({ type: "original_transcript", label: "Original transcript", detail: "", quantity: 0, rate: r.original_per_page, amount: 0 });
  }
  if (r.copy_per_page) {
    lines.push({ type: "copy", label: "Copy", detail: "", quantity: 0, rate: r.copy_per_page, amount: 0 });
  }
  return lines;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const plus30 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

/** Add N days to an ISO yyyy-mm-dd string and return ISO yyyy-mm-dd. */
const addDays = (iso, n) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + (parseInt(n, 10) || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function InvoiceBuilder() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get("job_id") || null;

  const [clients, setClients] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [job, setJob] = useState(null);
  const [client, setClient] = useState(null);

  const [invoice, setInvoice] = useState({
    invoice_number: "",
    job_id: initialJobId,
    client_id: "",
    invoice_date: todayISO(),
    due_date: plus30(),
    line_items: [],
    notes: "",
    payment_instructions: "Please remit payment within 30 days. Make checks payable to the reporter named above.",
    status: "Draft",
    sent_at: null,
    paid_at: null,
  });

  const [globalErr, setGlobalErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [tmplOpen, setTmplOpen] = useState(false);
  const [tmplName, setTmplName] = useState("");

  // Due date auto-tracks invoice_date + user.default_net_days unless the
  // reporter has explicitly edited Due (or loaded an existing invoice whose
  // saved due_date no longer matches the formula).
  const netDays = user?.default_net_days ?? 30;
  const [dueOverridden, setDueOverridden] = useState(false);

  // initial load
  useEffect(() => {
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
    api.get("/jobs").then((r) => setJobs(r.data)).catch(() => {});

    if (editing) {
      api.get(`/invoices/${id}`)
        .then((r) => {
          setInvoice((p) => ({ ...p, ...r.data }));
          // If the existing invoice's due_date doesn't match invoice_date + net_days,
          // assume the reporter intentionally set a custom due date.
          const formula = addDays(r.data.invoice_date, netDays);
          if (r.data.due_date && r.data.due_date !== formula) {
            setDueOverridden(true);
          }
        })
        .catch((e) => setGlobalErr(errMessage(e)));
    } else if (initialJobId) {
      api.get(`/jobs/${initialJobId}`)
        .then((r) => {
          setInvoice((p) => ({ ...p, job_id: r.data.id, client_id: r.data.client_id }));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line
  }, []);

  // resolve client/job objects
  useEffect(() => {
    setClient(clients.find((c) => c.id === invoice.client_id) || null);
  }, [invoice.client_id, clients]);

  useEffect(() => {
    if (invoice.job_id) {
      const j = jobs.find((x) => x.id === invoice.job_id);
      if (j) setJob(j);
    } else {
      setJob(null);
    }
  }, [invoice.job_id, jobs]);

  // Auto-track Due date = Invoice date + net_days, unless overridden.
  useEffect(() => {
    if (dueOverridden) return;
    if (!invoice.invoice_date) return;
    const computed = addDays(invoice.invoice_date, netDays);
    if (computed && computed !== invoice.due_date) {
      setInvoice((p) => ({ ...p, due_date: computed }));
    }
    // eslint-disable-next-line
  }, [invoice.invoice_date, netDays, dueOverridden]);

  // when starting from a job & line_items empty, prefill from client default rates
  useEffect(() => {
    if (!editing && client && invoice.line_items.length === 0) {
      const lines = defaultLinesFromClient(client);
      if (lines.length > 0) setInvoice((p) => ({ ...p, line_items: lines }));
    }
    // eslint-disable-next-line
  }, [client]);

  const total = useMemo(
    () => invoice.line_items.reduce((acc, li) => acc + (parseFloat(li.amount) || 0), 0),
    [invoice.line_items]
  );

  // ---- helpers
  const set = (k, v) => setInvoice((p) => ({ ...p, [k]: v }));
  const updateLine = (idx, patch) =>
    setInvoice((p) => {
      const next = [...p.line_items];
      const cur = { ...next[idx], ...patch };
      const meta = LINE_TYPES.find((l) => l.type === cur.type);
      if (meta?.input === "pages") {
        const q = parseFloat(cur.quantity) || 0;
        const r = parseFloat(cur.rate) || 0;
        cur.amount = +(q * r).toFixed(2);
      }
      next[idx] = cur;
      return { ...p, line_items: next };
    });
  const removeLine = (idx) =>
    setInvoice((p) => ({ ...p, line_items: p.line_items.filter((_, i) => i !== idx) }));
  const addLine = (type) =>
    setInvoice((p) => ({ ...p, line_items: [...p.line_items, newLine(type)] }));

  const onSave = async () => {
    setGlobalErr("");
    if (!invoice.client_id) return setGlobalErr("Please choose a client first.");
    if (invoice.line_items.length === 0) return setGlobalErr("Please add at least one line item before saving.");
    setSaving(true);
    try {
      const payload = {
        job_id: invoice.job_id || null,
        client_id: invoice.client_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        line_items: invoice.line_items.map((li) => ({
          ...li,
          quantity: li.quantity === "" ? null : li.quantity,
          rate: li.rate === "" ? null : li.rate,
          amount: parseFloat(li.amount) || 0,
        })),
        notes: invoice.notes || null,
        payment_instructions: invoice.payment_instructions || null,
      };
      let saved;
      if (editing) {
        saved = (await api.put(`/invoices/${id}`, payload)).data;
        toast.success("Invoice updated.");
        setInvoice((p) => ({ ...p, ...saved }));
      } else {
        saved = (await api.post("/invoices", payload)).data;
        toast.success(`Invoice ${saved.invoice_number} created.`);
        navigate(`/app/invoices/${saved.id}`);
      }
    } catch (e) {
      setGlobalErr(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onMarkPaid = async (payment) => {
    if (!editing) return;
    try {
      const { data } = await api.post(`/invoices/${id}/mark-paid`, payment || null);
      setInvoice((p) => ({ ...p, ...data }));
      toast.success("Marked as paid.");
      setPaidOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onVoid = async () => {
    if (!editing) return;
    if (!window.confirm("Void this invoice? It'll stay on file but won't count toward totals.")) return;
    try {
      const { data } = await api.post(`/invoices/${id}/void`);
      setInvoice((p) => ({ ...p, ...data }));
      toast.success("Invoice voided.");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onDownloadPdf = () => {
    if (!editing) return;
    // open in new tab; auth via cookie
    window.open(`${API}/invoices/${id}/pdf`, "_blank");
  };

  const onDelete = async () => {
    if (!editing) return;
    if (!window.confirm("Delete this invoice? This can't be undone.")) return;
    await api.delete(`/invoices/${id}`);
    toast.success("Invoice deleted.");
    navigate("/app/invoices");
  };

  const onGetShareLink = async () => {
    if (!editing) return;
    try {
      const { data } = await api.post(`/portal/invoice/${id}/share-link`);
      setShareUrl(data.url);
      setShareOpen(true);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onCopyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard.");
  };

  const onRegenerateShareToken = async () => {
    if (!editing) return;
    if (!window.confirm("Generate a new link? The current one will stop working.")) return;
    try {
      const { data } = await api.post(`/portal/invoice/${id}/regenerate-token`);
      setShareUrl(data.url);
      toast.success("New link generated.");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onEmailShareLink = async () => {
    if (!editing) return;
    try {
      await api.post(`/portal/invoice/${id}/email-share-link`, {});
      toast.success("Share link emailed to the client.");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onSaveAsTemplate = async () => {
    if (invoice.line_items.length === 0) {
      toast.error("Add at least one line item before saving a template.");
      return;
    }
    if (!tmplName.trim()) {
      toast.error("Give your template a name.");
      return;
    }
    try {
      await api.post("/templates", {
        name: tmplName.trim(),
        client_id: invoice.client_id || null,
        line_items: invoice.line_items.map((li) => ({
          ...li,
          amount: parseFloat(li.amount) || 0,
          quantity: li.quantity === "" ? null : li.quantity,
          rate: li.rate === "" ? null : li.rate,
        })),
        notes: invoice.notes || null,
        payment_instructions: invoice.payment_instructions || null,
      });
      toast.success(`Template "${tmplName.trim()}" saved.`);
      setTmplOpen(false);
      setTmplName("");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <AppShell
      title={editing ? `Invoice ${invoice.invoice_number || ""}` : "New invoice"}
      actions={
        <>
          <Link to="/app/invoices">
            <Button variant="outline" className="border-stone-300" data-testid="invoice-back">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Invoices
            </Button>
          </Link>
          {editing && invoice.status !== "Paid" && invoice.status !== "Void" && (
            <Button variant="outline" className="border-stone-300" onClick={() => setPaidOpen(true)} data-testid="invoice-mark-paid">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark paid
            </Button>
          )}
          {editing && invoice.status !== "Void" && invoice.status !== "Paid" && (
            <Button variant="outline" className="border-stone-300 text-[#B91C1C] hover:bg-[#FEE2E2]" onClick={onVoid} data-testid="invoice-void">
              <Ban className="h-4 w-4 mr-1.5" /> Void
            </Button>
          )}
          {editing && (
            <Button variant="outline" className="border-stone-300" onClick={() => setTmplOpen(true)} data-testid="invoice-save-template">
              <FileStack className="h-4 w-4 mr-1.5" /> Save as template
            </Button>
          )}
          {editing && invoice.status !== "Void" && (
            <Button variant="outline" className="border-stone-300" onClick={onGetShareLink} data-testid="invoice-share-link">
              <LinkIcon className="h-4 w-4 mr-1.5" /> Share link
            </Button>
          )}
          {editing && (
            <Button variant="outline" className="border-stone-300" onClick={onDownloadPdf} data-testid="invoice-download-pdf">
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </Button>
          )}
          {editing && invoice.status === "Sent" && (
            <Button
              variant="outline"
              className="border-amber-300 text-amber-900 hover:bg-amber-50"
              onClick={() => setFollowUpOpen(true)}
              data-testid="invoice-open-follow-up"
            >
              <Send className="h-4 w-4 mr-1.5" /> Send follow-up
            </Button>
          )}
          {editing && (
            <Button onClick={() => setSendOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="invoice-open-send">
              <Send className="h-4 w-4 mr-1.5" /> {invoice.status === "Sent" ? "Re-send" : "Send invoice"}
            </Button>
          )}
        </>
      }
    >
      {globalErr && (
        <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2" data-testid="invoice-error">
          {globalErr}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Builder */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-stone-200 rounded-md p-5">
            <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-3">Header</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block mb-1.5">Client *</Label>
                <Select value={invoice.client_id} onValueChange={(v) => set("client_id", v)} disabled={editing}>
                  <SelectTrigger data-testid="inv-client"><SelectValue placeholder="Choose a client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block mb-1.5">From job (optional)</Label>
                <Select value={invoice.job_id || "none"} onValueChange={(v) => set("job_id", v === "none" ? null : v)}>
                  <SelectTrigger data-testid="inv-job"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked job</SelectItem>
                    {jobs
                      .filter((j) => !invoice.client_id || j.client_id === invoice.client_id)
                      .map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.job_date} · {j.witness}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block mb-1.5">Invoice date</Label>
                <DatePicker value={invoice.invoice_date} onChange={(v) => set("invoice_date", v)} clearable={false} data-testid="inv-date" />
              </div>
              <div>
                <Label className="block mb-1.5">Due date</Label>
                <DatePicker
                  value={invoice.due_date}
                  onChange={(v) => {
                    // Any user-driven Due change marks it as overridden so the
                    // invoice_date effect stops auto-tracking.
                    setDueOverridden(true);
                    set("due_date", v);
                  }}
                  clearable={false}
                  data-testid="inv-due"
                />
                <div className="mt-1.5 text-[12px] text-[#6B7280]" data-testid="inv-due-affordance">
                  {dueOverridden ? (
                    <>
                      <span className="text-[#B45309]">Custom · </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDueOverridden(false);
                          // Trigger the auto-track effect immediately
                          set("due_date", addDays(invoice.invoice_date, netDays));
                        }}
                        className="underline hover:text-[#1F2937]"
                        data-testid="inv-due-reset"
                      >
                        Reset to {netDays} days from invoice date
                      </button>
                    </>
                  ) : (
                    <>Auto · {netDays} days from invoice date</>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500">Line items</div>
              <AddLineMenu onAdd={addLine} />
            </div>

            {invoice.line_items.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-stone-300 rounded">
                <p className="text-sm text-stone-600 mb-3">No line items yet.</p>
                <AddLineMenu onAdd={addLine} primary />
              </div>
            ) : (
              <div className="space-y-3">
                {invoice.line_items.map((li, idx) => {
                  const meta = LINE_TYPES.find((l) => l.type === li.type);
                  return (
                    <div key={idx} className="border border-stone-200 rounded p-3" data-testid={`inv-line-${idx}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Select value={li.type} onValueChange={(v) => {
                              const meta2 = LINE_TYPES.find((l) => l.type === v);
                              updateLine(idx, {
                                type: v,
                                label: meta2.label,
                                quantity: meta2.input === "pages" ? (li.quantity ?? 0) : null,
                                rate: meta2.input === "pages" ? (li.rate ?? 0) : null,
                              });
                            }}>
                              <SelectTrigger className="w-[220px] h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {LINE_TYPES.map((t) => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Input
                              value={li.label}
                              onChange={(e) => updateLine(idx, { label: e.target.value })}
                              className="h-9"
                              placeholder="Label as it appears on the invoice"
                              data-testid={`inv-line-${idx}-label`}
                            />
                          </div>
                          <Input
                            value={li.detail || ""}
                            onChange={(e) => updateLine(idx, { detail: e.target.value })}
                            className="mt-2 h-9 text-xs"
                            placeholder={meta?.input === "pages" ? "e.g. 210pp @ $4.25 — depo of J. Smith" : "Optional detail / description"}
                            data-testid={`inv-line-${idx}-detail`}
                          />
                          {meta?.input === "pages" ? (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div>
                                <Label className="text-xs">Quantity</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  value={li.quantity ?? ""}
                                  onChange={(e) => updateLine(idx, { quantity: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                                  className="h-9"
                                  data-testid={`inv-line-${idx}-qty`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Rate</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  value={li.rate ?? ""}
                                  onChange={(e) => updateLine(idx, { rate: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                                  className="h-9"
                                  data-testid={`inv-line-${idx}-rate`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Amount</Label>
                                <Input
                                  readOnly
                                  value={(li.amount || 0).toFixed(2)}
                                  className="h-9 bg-stone-50 font-mono"
                                  data-testid={`inv-line-${idx}-amount-calc`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="col-span-2"></div>
                              <div>
                                <Label className="text-xs">Amount</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  value={li.amount ?? 0}
                                  onChange={(e) => updateLine(idx, { amount: parseFloat(e.target.value) || 0 })}
                                  className="h-9 font-mono"
                                  data-testid={`inv-line-${idx}-amount`}
                                />
                              </div>
                            </div>
                          )}
                          {meta?.negative && (li.amount > 0) && (
                            <div className="text-xs text-amber-800 mt-2">
                              Tip: enter this as a negative number to deduct from the total.
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeLine(idx)}
                          className="text-stone-400 hover:text-red-700 p-1"
                          aria-label="Remove line"
                          data-testid={`inv-line-${idx}-remove`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-200 flex justify-end items-baseline gap-3">
              <span className="text-xs uppercase tracking-wider text-stone-500">Total</span>
              <span className="font-serif text-3xl text-slate-900" data-testid="inv-total">{fmt(total)}</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-5">
            <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-3">Notes & payment</div>
            <Label className="block mb-1.5">Notes (optional, appears on invoice)</Label>
            <Textarea value={invoice.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={2} data-testid="inv-notes" />
            <Label className="block mb-1.5 mt-3">Payment instructions</Label>
            <Textarea value={invoice.payment_instructions || ""} onChange={(e) => set("payment_instructions", e.target.value)} rows={2} data-testid="inv-payment" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {editing && (
                <Button variant="ghost" onClick={onDelete} className="text-red-700 hover:bg-red-50" data-testid="inv-delete">
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete invoice
                </Button>
              )}
            </div>
            <Button onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="inv-save">
              {saving ? "Saving…" : (editing ? "Save changes" : "Save draft")}
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 self-start">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500">Preview</div>
            {editing && (
              <div className="flex items-center gap-1.5">
                <StatusPill status={invoice.status} />
                <DeliveryChip invoice={invoice} />
              </div>
            )}
          </div>
          {editing && (invoice.delivered_at || invoice.opened_at || invoice.bounce_status) && (
            <DeliveryTimeline invoice={invoice} />
          )}
          <InvoicePreview
            invoice={invoice}
            client={client}
            job={job}
            reporter={user}
            total={total}
          />
        </div>
      </div>

      <SendInvoiceDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        invoiceId={id}
        invoice={invoice}
        client={client}
        job={job}
        onSent={(sent_at) => setInvoice((p) => ({ ...p, status: "Sent", sent_at }))}
      />

      <FollowUpDialog
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        invoiceId={id}
        invoice={invoice}
        client={client}
        onSent={(meta) => setInvoice((p) => ({
          ...p,
          last_reminder_sent_at: meta.sent_at,
          reminders_sent_count: meta.reminders_sent_count,
          message_id: meta.message_id,
        }))}
      />

      <MarkPaidDialog
        open={paidOpen}
        onClose={() => setPaidOpen(false)}
        invoice={invoice}
        onConfirm={onMarkPaid}
      />

      {/* Share-link dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-lg" data-testid="share-link-dialog">
          <DialogHeader>
            <DialogTitle>Share invoice with client</DialogTitle>
            <DialogDescription>
              Anyone with this link can view and download this invoice. No login needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="block">Public link</Label>
            <Input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              data-testid="share-link-input"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={onCopyShareUrl} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="share-copy">
                <LinkIcon className="h-4 w-4 mr-1.5" /> Copy link
              </Button>
              {invoice.billed_to_email && (
                <Button variant="outline" className="border-stone-300" onClick={onEmailShareLink} data-testid="share-email">
                  <Send className="h-4 w-4 mr-1.5" /> Email to {invoice.billed_to_email}
                </Button>
              )}
              <Button variant="ghost" className="text-amber-700" onClick={onRegenerateShareToken} data-testid="share-regen">
                Regenerate link
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save-as-template dialog */}
      <Dialog open={tmplOpen} onOpenChange={setTmplOpen}>
        <DialogContent className="max-w-md" data-testid="save-template-dialog">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>
              We'll keep these line items, notes, and payment instructions ready to spin up a new invoice in one click.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="block">Template name</Label>
            <Input
              value={tmplName}
              onChange={(e) => setTmplName(e.target.value)}
              placeholder="Big Co monthly retainer"
              data-testid="template-name-input"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTmplOpen(false)}>Cancel</Button>
            <Button onClick={onSaveAsTemplate} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="template-save-btn">
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function AddLineMenu({ onAdd, primary }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Select
        value={val}
        onValueChange={(v) => {
          onAdd(v);
          setVal("");
        }}
      >
        <SelectTrigger className={`h-9 w-[200px] ${primary ? "" : ""}`} data-testid="inv-add-line">
          <SelectValue placeholder={primary ? "Add a line item…" : "+ Add line item"} />
        </SelectTrigger>
        <SelectContent>
          {LINE_TYPES.map((t) => (
            <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InvoicePreview({ invoice, client, job, reporter, total }) {
  const r = reporter || {};
  const { blobUrl: letterheadUrl } = useLetterheadBlob(r.letterhead_url, r.letterhead_uploaded_at);

  // When a letterhead image is set, surface only the cert line below it
  // (mirrors the PDF generator's logic so what Marie sees == what attorneys get).
  const certBits = [];
  if (r.cert_type) certBits.push(r.cert_type);
  if (r.cert_number) certBits.push(`Cert. ${r.cert_number}`);
  const certLine = certBits.join(" · ");

  return (
    <div className="bg-white border border-stone-200 sd-paper aspect-[8.5/11] overflow-y-auto" data-testid="invoice-preview">
      <div className="p-7">
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-stone-200">
          <div className="min-w-0 flex-1 pr-4">
            {letterheadUrl ? (
              <>
                <img
                  src={letterheadUrl}
                  alt="Letterhead"
                  className="max-h-[60px] max-w-[230px] object-contain object-left mb-2"
                  data-testid="invoice-preview-letterhead"
                />
                {certLine && <div className="text-[10px] text-stone-500">{certLine}</div>}
              </>
            ) : (
              <>
                <div className="font-serif text-xl text-[#1E293B] leading-tight">
                  {r.business_name || r.name || "Your name"}
                </div>
                {r.business_name && r.name && (
                  <div className="text-[10px] text-stone-600 mt-0.5">{r.name}</div>
                )}
                {certLine && <div className="text-[10px] text-stone-500">{certLine}</div>}
              </>
            )}
            {r.address_line1 && <div className="text-[10px] text-stone-500 mt-1">{r.address_line1}</div>}
            {r.address_line2 && <div className="text-[10px] text-stone-500">{r.address_line2}</div>}
            {(r.city || r.state || r.zip) && (
              <div className="text-[10px] text-stone-500">
                {[r.city, [r.state, r.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
              </div>
            )}
            {!r.address_line1 && r.address && (
              <div className="text-[10px] text-stone-500 whitespace-pre-line mt-1">{r.address}</div>
            )}
            {r.phone && <div className="text-[10px] text-stone-500">{r.phone}</div>}
            {r.email && <div className="text-[10px] text-stone-500">{r.email}</div>}
          </div>
          <div className="text-right shrink-0">
            <div className="font-serif text-3xl text-slate-900 tracking-tight leading-none">INVOICE</div>
            <div className="text-[10px] text-stone-700 mt-1.5">
              <span className="font-mono">{invoice.invoice_number || "#SD-—"}</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">Issued {invoice.invoice_date}<br />Due {invoice.due_date}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <div className="text-[9px] tracking-wider text-stone-400 uppercase mb-1">Bill to</div>
            <div className="text-[11px] font-medium text-slate-800">{client?.name || "—"}</div>
            {client?.contact_name && <div className="text-[10px] text-stone-600">Attn: {client.contact_name}</div>}
            {client?.billing_address && <div className="text-[10px] text-stone-600 whitespace-pre-line">{client.billing_address}</div>}
            {client?.contact_email && <div className="text-[10px] text-stone-600">{client.contact_email}</div>}
          </div>
          <div>
            <div className="text-[9px] tracking-wider text-stone-400 uppercase mb-1">Matter</div>
            {job?.case_caption && <div className="text-[11px] font-serif text-slate-800 leading-tight">{job.case_caption}</div>}
            {job?.case_number && <div className="text-[10px] text-stone-600"><b>Case No.</b> {job.case_number}</div>}
            {job?.witness && <div className="text-[10px] text-stone-600"><b>Witness:</b> {job.witness}</div>}
            {job?.job_date && <div className="text-[10px] text-stone-600"><b>Job date:</b> {job.job_date}</div>}
            {!job && <div className="text-[10px] text-stone-400">— No linked job —</div>}
          </div>
        </div>

        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[9px] tracking-wider text-stone-400 uppercase border-b border-stone-200">
              <th className="text-left py-1.5">Description</th>
              <th className="text-left py-1.5">Detail</th>
              <th className="text-right py-1.5">Amount</th>
            </tr>
          </thead>
          <tbody className="text-stone-700">
            {invoice.line_items.length === 0 ? (
              <tr><td colSpan={3} className="text-center text-stone-400 py-6 text-[11px]">— Add line items to see them here —</td></tr>
            ) : (
              invoice.line_items.map((li, idx) => (
                <tr key={idx} className="border-b border-stone-100">
                  <td className="py-1.5 font-medium text-slate-800">{li.label}</td>
                  <td className="py-1.5 text-stone-600">{li.detail || (li.quantity ? `${li.quantity} × ${fmt(li.rate || 0)}` : "")}</td>
                  <td className={`py-1.5 text-right ${(parseFloat(li.amount) || 0) < 0 ? "text-stone-500" : ""}`}>
                    {fmt(parseFloat(li.amount) || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-3 pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
          <span className="text-[9px] tracking-wider text-stone-500 uppercase">Total Due</span>
          <span className="font-serif text-2xl text-slate-900">{fmt(total)}</span>
        </div>

        {invoice.notes && (
          <div className="mt-4">
            <div className="text-[9px] tracking-wider text-stone-400 uppercase mb-1">Notes</div>
            <div className="text-[10px] text-stone-700 whitespace-pre-line">{invoice.notes}</div>
          </div>
        )}
        {invoice.payment_instructions && (
          <div className="mt-3">
            <div className="text-[9px] tracking-wider text-stone-400 uppercase mb-1">Payment</div>
            <div className="text-[10px] text-stone-700 whitespace-pre-line">{invoice.payment_instructions}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SendInvoiceDialog({ open, onClose, invoiceId, invoice, client, job, onSent }) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [orderingAtty, setOrderingAtty] = useState(null);

  // Pull the ordering attorney record so we can pre-fill their email per spec.
  useEffect(() => {
    if (!open || !job?.ordering_attorney_id) {
      setOrderingAtty(null);
      return;
    }
    api
      .get("/attorneys", { params: { client_id: job.client_id || client?.id } })
      .then((r) => {
        const found = (r.data || []).find((a) => a.id === job.ordering_attorney_id);
        setOrderingAtty(found || null);
      })
      .catch(() => setOrderingAtty(null));
  }, [open, job, client]);

  useEffect(() => {
    if (!open) return;
    const caption = job?.case_caption ? ` — ${job.case_caption}` : "";
    setSubject(`Invoice ${invoice.invoice_number || ""}${caption}`);
    // Per V1 spec: pre-fill with ordering attorney's email if known, otherwise
    // fall back to the client's billing contact email.
    const preferred = orderingAtty?.email || client?.contact_email || "";
    setTo(preferred);
    const greetingName = orderingAtty
      ? `${orderingAtty.first_name} ${orderingAtty.last_name}`
      : client?.contact_name || "";
    setBody(
`Hello${greetingName ? " " + greetingName : ""},

Please find attached invoice ${invoice.invoice_number || ""} for ${job?.case_caption || "the recent job"}${job?.job_date ? ` on ${job.job_date}` : ""}.

Total due: ${(invoice.line_items || []).reduce((a, b) => a + (parseFloat(b.amount) || 0), 0).toFixed(2)}

Thank you,`
    );
    setCc("");
    setErr("");
  }, [open, invoice, client, job, orderingAtty]);

  const onSend = async () => {
    setErr("");
    if (!to) return setErr("Please add a recipient email.");
    setSending(true);
    try {
      const { data } = await api.post(`/invoices/${invoiceId}/send`, {
        to_email: to,
        cc: cc || null,
        subject,
        body,
      });
      toast.success("Invoice sent.");
      onSent(data.sent_at);
      onClose();
    } catch (e) {
      setErr(errMessage(e, "We couldn't send this email right now. Please try again, or download the PDF and send it from your inbox."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-testid="send-invoice-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif">Send invoice</DialogTitle>
          <DialogDescription>The PDF will be attached automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="block mb-1.5">To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="ordering attorney email" data-testid="send-to" />
          </div>
          <div>
            <Label className="block mb-1.5">Cc (optional)</Label>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} data-testid="send-cc" />
          </div>
          <div>
            <Label className="block mb-1.5">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="send-subject" />
          </div>
          <div>
            <Label className="block mb-1.5">Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} data-testid="send-body" />
          </div>
          {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2" data-testid="send-error">{err}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-stone-300">Cancel</Button>
          <Button onClick={onSend} disabled={sending} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="send-confirm">
            {sending ? "Sending…" : "Send invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * FollowUpDialog — manual nudge on an already-sent invoice.
 *
 * The pre-filled message is context-aware:
 *   - If the client has opened the invoice → "Wanted to follow up since you
 *     had a chance to look at this…"  (assumes they saw it; gentler tone)
 *   - If they haven't opened it yet → "Just wanted to make sure this
 *     reached your inbox…"  (assumes it may be lost; less accusatory)
 *
 * Backend `/invoices/{id}/follow-up` re-sends the PDF AND bumps
 * `reminders_sent_count` so the 7/14/30-day automated reminder won't pile on.
 */
function FollowUpDialog({ open, onClose, invoiceId, invoice, client, onSent }) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    const opened = !!invoice?.opened_at;
    const invNo = invoice?.invoice_number || "";
    const amt = (parseFloat(invoice?.total) || 0).toFixed(2);
    const dueRaw = invoice?.due_date || "";
    const daysOverdue = (() => {
      try {
        const due = new Date(dueRaw + "T00:00:00Z");
        const diff = Math.floor((Date.now() - due.getTime()) / 86400000);
        return diff;
      } catch { return null; }
    })();

    setTo(invoice?.billed_to_email || client?.contact_email || "");
    setCc("");
    setSubject(`Following up: Invoice ${invNo} ($${amt})`);

    const greet = client?.contact_name ? `Hi ${client.contact_name}` : "Hi there";
    let opener;
    if (opened) {
      opener = (
        `${greet},\n\n` +
        `I'm circling back on invoice ${invNo} for $${amt}` +
        (daysOverdue != null && daysOverdue > 0
          ? ` — it shows as ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} past due.`
          : `.`) +
        ` Just wanted to check in and see if you have any questions or need anything from me to get this processed.`
      );
    } else {
      opener = (
        `${greet},\n\n` +
        `Just following up to make sure invoice ${invNo} for $${amt} reached your inbox` +
        (daysOverdue != null && daysOverdue > 0
          ? ` — it's now ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} past due,`
          : `,`) +
        ` so I wanted to flag it in case it got buried. I've re-attached the PDF for convenience.`
      );
    }
    const closing =
      `If payment is already on its way, please disregard — and thank you.\n\n` +
      `Otherwise, happy to answer any questions.`;
    setBody(`${opener}\n\n${closing}`);
    setErr("");
  }, [open, invoice, client]);

  const onSend = async () => {
    setErr("");
    if (!to) return setErr("Please add a recipient email.");
    setSending(true);
    try {
      const { data } = await api.post(`/invoices/${invoiceId}/follow-up`, {
        to_email: to,
        cc: cc || null,
        subject,
        body,
      });
      toast.success("Follow-up sent.");
      onSent(data);
      onClose();
    } catch (e) {
      setErr(errMessage(e, "We couldn't send this follow-up right now. Please try again, or download the PDF and send it from your inbox."));
    } finally {
      setSending(false);
    }
  };

  const remindersSent = parseInt(invoice?.reminders_sent_count || 0, 10);
  const lastReminderAt = invoice?.last_reminder_sent_at;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-testid="follow-up-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif">Send follow-up</DialogTitle>
          <DialogDescription>
            {invoice?.opened_at
              ? "Your client opened this invoice — a quick nudge while it's fresh in their mind often works wonders."
              : "Re-send the invoice with the PDF re-attached and a friendly nudge."}
          </DialogDescription>
        </DialogHeader>
        {(remindersSent > 0 || lastReminderAt) && (
          <div className="text-[12px] bg-amber-50 border border-amber-200 text-amber-900 rounded px-3 py-2 -mt-1">
            {remindersSent === 0
              ? `Last follow-up sent ${lastReminderAt?.slice(0, 10)}.`
              : `${remindersSent} follow-up${remindersSent === 1 ? "" : "s"} sent so far` +
                (lastReminderAt ? ` (most recent ${lastReminderAt.slice(0, 10)}).` : ".")}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <Label className="block mb-1.5">To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} data-testid="follow-up-to" />
          </div>
          <div>
            <Label className="block mb-1.5">Cc (optional)</Label>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} data-testid="follow-up-cc" />
          </div>
          <div>
            <Label className="block mb-1.5">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="follow-up-subject" />
          </div>
          <div>
            <Label className="block mb-1.5">Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} data-testid="follow-up-body" />
          </div>
          {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2" data-testid="follow-up-error">{err}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-stone-300">Cancel</Button>
          <Button onClick={onSend} disabled={sending} className="bg-amber-700 hover:bg-amber-800 text-white" data-testid="follow-up-confirm">
            {sending ? "Sending…" : "Send follow-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkPaidDialog({ open, onClose, invoice, onConfirm }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("check");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount(((parseFloat(invoice?.total) || 0)).toFixed(2));
      setMethod("check");
      setReference("");
      setNotes("");
      setErr("");
    }
  }, [open, invoice]);

  const onSave = async () => {
    setErr("");
    const a = parseFloat(amount);
    if (!a || isNaN(a)) return setErr("Please enter the payment amount.");
    setSaving(true);
    try {
      await onConfirm({
        amount: a,
        payment_date: date,
        payment_method: method,
        reference: reference || null,
        notes: notes || null,
      });
    } catch (e) {
      setErr(e?.message || "Couldn't mark this invoice as paid.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-testid="mark-paid-dialog">
        <DialogHeader>
          <DialogTitle>Mark as paid</DialogTitle>
          <DialogDescription>
            Record the payment. The invoice status updates to Paid.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block mb-1.5">Payment date</Label>
              <DatePicker value={date} onChange={setDate} clearable={false} data-testid="paid-date" />
            </div>
            <div>
              <Label className="block mb-1.5">Amount</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="paid-amount" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block mb-1.5">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger data-testid="paid-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="wire">Wire</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block mb-1.5">Reference (check #, etc.)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} data-testid="paid-reference" />
            </div>
          </div>
          <div>
            <Label className="block mb-1.5">Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="paid-notes" />
          </div>
          {err && <div className="text-[14px] bg-[#FEE2E2] border border-[#B91C1C]/30 text-[#B91C1C] rounded-md px-3 py-2">{err}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-stone-300" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={saving} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="paid-confirm">
            {saving ? "Saving…" : "Mark as paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/**
 * DeliveryTimeline — small panel above the invoice preview that lists
 * Postmark delivery events (sent → delivered → opened, or bounced). Only
 * renders when at least one event exists.
 */
function DeliveryTimeline({ invoice }) {
  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleString("en-US", {
          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        })
      : "—";
  const events = [];
  if (invoice.sent_at) events.push({ k: "sent", label: "Sent", at: invoice.sent_at, tone: "stone" });
  if (invoice.delivered_at) events.push({ k: "delivered", label: "Delivered", at: invoice.delivered_at, tone: "stone" });
  if (invoice.opened_at) {
    const n = invoice.opens_count || 1;
    events.push({
      k: "opened",
      label: n === 1 ? "Opened" : `Opened (${n}×)`,
      at: invoice.last_opened_at || invoice.opened_at,
      tone: "emerald",
    });
  }
  if (invoice.bounce_status) {
    events.push({
      k: "bounced",
      label: `Bounced — ${invoice.bounce_status}`,
      at: invoice.bounce_at,
      tone: "red",
      detail: invoice.bounce_message,
    });
  }
  if (events.length === 0) return null;
  const toneClass = {
    stone: "text-stone-700",
    emerald: "text-emerald-800",
    red: "text-red-800",
  };
  return (
    <div className="bg-white border border-[#E5E1DA] rounded-md px-4 py-3 mb-3 text-[13px]" data-testid="delivery-timeline">
      <div className="text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-2">
        Delivery
      </div>
      <ul className="space-y-1.5">
        {events.map((e) => (
          <li key={e.k} className="flex items-start gap-2">
            <span className={`h-1.5 w-1.5 rounded-full mt-2 ${e.tone === "emerald" ? "bg-emerald-500" : e.tone === "red" ? "bg-red-500" : "bg-stone-400"}`} />
            <div className="min-w-0 flex-1">
              <div className={`font-medium ${toneClass[e.tone]}`}>{e.label}</div>
              <div className="text-stone-500 text-[12px] tabular">{fmt(e.at)}</div>
              {e.detail && <div className="text-stone-600 text-[12px] mt-0.5">{e.detail}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

