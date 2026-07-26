import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Play, Pencil } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
];
const DOWS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const blankLine = () => ({ type: "custom", label: "Retainer", quantity: null, rate: null, amount: 0 });

export default function Recurring() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    client_id: "",
    frequency: "monthly",
    day_of_month: 1,
    day_of_week: 1,
    next_run_date: new Date().toISOString().slice(0, 10),
    line_items: [blankLine()],
    notes: "",
    payment_instructions: "",
    active: true,
  });

  const load = () =>
    api.get("/recurring").then((r) => setItems(r.data)).catch((e) => setErr(errMessage(e)));

  useEffect(() => {
    load();
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
  }, []);

  const cn = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      client_id: "",
      frequency: "monthly",
      day_of_month: 1,
      day_of_week: 1,
      next_run_date: new Date().toISOString().slice(0, 10),
      line_items: [blankLine()],
      notes: "",
      payment_instructions: "",
      active: true,
    });
    setOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      name: r.name,
      client_id: r.client_id,
      frequency: r.frequency,
      day_of_month: r.day_of_month || 1,
      day_of_week: r.day_of_week || 1,
      next_run_date: r.next_run_date,
      line_items: r.line_items?.length ? r.line_items : [blankLine()],
      notes: r.notes || "",
      payment_instructions: r.payment_instructions || "",
      active: !!r.active,
    });
    setOpen(true);
  };

  const updateLine = (idx, patch) =>
    setForm((p) => {
      const next = [...p.line_items];
      next[idx] = { ...next[idx], ...patch };
      return { ...p, line_items: next };
    });
  const addLine = () => setForm((p) => ({ ...p, line_items: [...p.line_items, blankLine()] }));
  const removeLine = (i) =>
    setForm((p) => ({ ...p, line_items: p.line_items.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required.");
    if (!form.client_id) return toast.error("Choose a client.");
    if (!form.next_run_date) return toast.error("Set the first run date.");
    if (form.line_items.length === 0) return toast.error("Add at least one line item.");
    const payload = {
      ...form,
      day_of_month: parseInt(form.day_of_month, 10) || 1,
      day_of_week: parseInt(form.day_of_week, 10) || 1,
      line_items: form.line_items.map((li) => ({
        ...li,
        amount: parseFloat(li.amount) || 0,
        quantity: li.quantity === "" ? null : li.quantity,
        rate: li.rate === "" ? null : li.rate,
      })),
    };
    try {
      if (editing) {
        await api.put(`/recurring/${editing.id}`, payload);
        toast.success("Schedule updated.");
      } else {
        await api.post("/recurring", payload);
        toast.success("Schedule created.");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete "${r.name}"? Generated invoices stay on file.`)) return;
    await api.delete(`/recurring/${r.id}`);
    toast.success("Schedule deleted.");
    load();
  };

  const runNow = async (r) => {
    try {
      const { data } = await api.post(`/recurring/${r.id}/run-now`);
      toast.success(`Draft invoice ${data.invoice_number} created.`);
      navigate(`/app/invoices/${data.id}`);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const totalForm = form.line_items.reduce((acc, li) => acc + (parseFloat(li.amount) || 0), 0);

  return (
    <AppShell
      title="Recurring invoices"
      actions={
        <Button onClick={openNew} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="recurring-new-btn">
          <Plus className="h-4 w-4 mr-1.5" /> New schedule
        </Button>
      }
    >
      {err && <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>}

      <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <div className="px-5 py-16 text-center" data-testid="recurring-empty">
            <div className="text-[20px] font-semibold text-[#1F2937] mb-1">No recurring schedules.</div>
            <p className="text-stone-600 mb-5">
              Set up monthly retainers or weekly billing for repeat clients — Steno Desk drops a Draft invoice into your queue automatically.
            </p>
            <Button onClick={openNew} className="bg-[#1F2937] hover:bg-[#111827] text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Create your first schedule
            </Button>
          </div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th>Cadence</th>
                <th>Next run</th>
                <th className="!text-right">Amount</th>
                <th>Active</th>
                <th>Last run</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const sum = (r.line_items || []).reduce((a, li) => a + (parseFloat(li.amount) || 0), 0);
                return (
                  <tr key={r.id} data-testid={`recurring-row-${r.id}`}>
                    <td className="font-medium text-[#1F2937]">{r.name}</td>
                    <td className="text-stone-600">{cn[r.client_id] || "—"}</td>
                    <td className="text-stone-600 capitalize">
                      {r.frequency}
                      {r.frequency === "monthly" ? ` · day ${r.day_of_month}` : ` · ${DOWS.find((d) => d.value === r.day_of_week)?.label}`}
                    </td>
                    <td className="tabular text-stone-600">{fmtDate(r.next_run_date)}</td>
                    <td className="text-right tabular font-medium">{fmt(sum)}</td>
                    <td>
                      <span className={`text-xs border px-2 py-0.5 rounded ${r.active ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-stone-100 text-stone-600 border-stone-200"}`}>
                        {r.active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="text-xs text-stone-500">
                      {r.last_run_at ? `${r.runs_count}× · ${fmtDate(r.last_run_at)}` : "Never"}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => runNow(r)} className="h-7 px-2 text-emerald-700" data-testid={`recurring-run-${r.id}`}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Run now
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)} className="h-7 px-2" data-testid={`recurring-edit-${r.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r)} className="h-7 px-2 text-red-700" data-testid={`recurring-delete-${r.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit schedule" : "New recurring schedule"}</DialogTitle>
            <DialogDescription>
              On the next run date, Steno Desk creates a Draft invoice you can review and send.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block mb-1.5">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Big Co retainer" data-testid="recurring-name" />
              </div>
              <div>
                <Label className="block mb-1.5">Client *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger data-testid="recurring-client"><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="block mb-1.5">Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger data-testid="recurring-frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.frequency === "monthly" ? (
                <div>
                  <Label className="block mb-1.5">Day of month (1–28)</Label>
                  <Input type="number" min={1} max={28} value={form.day_of_month} onChange={(e) => setForm({ ...form, day_of_month: e.target.value })} data-testid="recurring-dom" />
                </div>
              ) : (
                <div>
                  <Label className="block mb-1.5">Day of week</Label>
                  <Select value={String(form.day_of_week)} onValueChange={(v) => setForm({ ...form, day_of_week: parseInt(v, 10) })}>
                    <SelectTrigger data-testid="recurring-dow"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOWS.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="block mb-1.5">Next run</Label>
                <DatePicker value={form.next_run_date} onChange={(v) => setForm({ ...form, next_run_date: v })} placeholder="Pick…" data-testid="recurring-next-run" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Line items</Label>
                <Button size="sm" variant="ghost" onClick={addLine} data-testid="recurring-add-line">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add line
                </Button>
              </div>
              <div className="border border-[#E5E1DA] rounded-md divide-y divide-[#E5E1DA]">
                {form.line_items.map((li, i) => (
                  <div key={i} className="px-3 py-2 grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-7" value={li.label} onChange={(e) => updateLine(i, { label: e.target.value })} placeholder="Label" data-testid={`recurring-line-label-${i}`} />
                    <Input className="col-span-3" type="number" step="0.01" value={li.amount} onChange={(e) => updateLine(i, { amount: e.target.value })} placeholder="Amount" data-testid={`recurring-line-amount-${i}`} />
                    <div className="col-span-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => removeLine(i)} className="h-7 px-2 text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm mt-2 tabular">
                <span className="text-stone-600">Total: </span>
                <span className="font-semibold text-[#1F2937]">{fmt(totalForm)}</span>
              </div>
            </div>

            <div>
              <Label className="block mb-1.5">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="recurring-notes" />
            </div>

            <div>
              <Label className="block mb-1.5">Payment instructions</Label>
              <Textarea rows={2} value={form.payment_instructions} onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })} data-testid="recurring-pay-inst" />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                data-testid="recurring-active"
              />
              <span className="text-[#1F2937]">Active — generate invoices on schedule</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="recurring-save">
              {editing ? "Save changes" : "Create schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
