import { useEffect, useMemo, useState } from "react";
import { api, API, errMessage } from "@/lib/api";
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
import DatePicker from "@/components/DatePicker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Download, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Scopist",
  "Mileage",
  "Software",
  "Continuing Education",
  "Supplies",
  "Equipment",
  "Professional Dues",
  "Other",
];

const IRS_2026_RATE = 0.7; // per-mile; user can edit

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export default function Expenses() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const reload = async () => {
    try {
      const { data } = await api.get("/expenses", { params: { year } });
      setItems(data);
    } catch (e) {
      setErr(errMessage(e));
    }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [year]);

  const ytd = useMemo(() => items.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0), [items]);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    reload();
  };

  const onExportCsv = () => {
    window.open(`${API}/expenses/export.csv?year=${year}`, "_blank");
  };

  const yearOptions = (() => {
    const cy = new Date().getFullYear();
    return [cy + 1, cy, cy - 1, cy - 2].map(String);
  })();

  return (
    <AppShell
      title="Expenses"
      actions={
        <>
          <div className="w-[120px]">
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="h-9" data-testid="expenses-year"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="border-stone-300" onClick={onExportCsv} data-testid="expenses-export">
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="expenses-add">
            <Plus className="h-4 w-4 mr-1.5" /> Add expense
          </Button>
        </>
      }
    >
      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-stone-500">{year} year-to-date</span>
            <span className="ml-3 font-mono font-medium text-slate-900" data-testid="expenses-ytd">{fmt(ytd)}</span>
          </div>
          <div className="text-xs text-stone-500">{items.length} {items.length === 1 ? "expense" : "expenses"}</div>
        </div>

        {err && <div className="px-4 py-3 text-sm bg-red-50 text-red-800 border-b border-red-200">{err}</div>}

        {items.length === 0 ? (
          <div className="px-4 py-16 text-center" data-testid="expenses-empty">
            <div className="font-serif text-xl text-slate-900 mb-1">No expenses logged for {year}.</div>
            <p className="text-stone-600 mb-5">Scopist payments, mileage, software, CE — log them as you go and export to CSV at tax time.</p>
            <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Add your first expense
            </Button>
          </div>
        ) : (
          <table className="w-full sd-table">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th className="text-right">Amount</th><th></th></tr></thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} data-testid={`expense-row-${e.id}`}>
                  <td className="font-mono text-xs">{e.date}</td>
                  <td className="text-slate-900">{e.description}</td>
                  <td><span className="inline-block bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded text-[11px]">{e.category}</span></td>
                  <td className="text-right font-mono">{fmt(e.amount)}</td>
                  <td className="text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(e); setOpen(true); }} className="text-stone-400 hover:text-slate-900 p-1" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(e.id)} className="text-stone-400 hover:text-red-700 p-1" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ExpenseDialog
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSaved={reload}
      />
    </AppShell>
  );
}

function ExpenseDialog({ open, onClose, editing, onSaved }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Scopist");
  const [miles, setMiles] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptPath, setReceiptPath] = useState(null);
  const [receiptType, setReceiptType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setDate(editing.date);
        setAmount(String(editing.amount ?? ""));
        setDescription(editing.description || "");
        setCategory(editing.category || "Other");
        setMiles(editing.miles != null ? String(editing.miles) : "");
        setNotes(editing.notes || "");
        setReceiptUrl(editing.receipt_url || null);
        setReceiptPath(editing.receipt_path || null);
        setReceiptType(editing.receipt_content_type || null);
      } else {
        setDate(new Date().toISOString().slice(0, 10));
        setAmount("");
        setDescription("");
        setCategory("Scopist");
        setMiles("");
        setNotes("");
        setReceiptUrl(null);
        setReceiptPath(null);
        setReceiptType(null);
      }
      setErr("");
    }
  }, [open, editing]);

  // Auto-fill amount from miles when category=Mileage
  useEffect(() => {
    if (category === "Mileage" && miles && !isNaN(parseFloat(miles))) {
      setAmount((parseFloat(miles) * IRS_2026_RATE).toFixed(2));
    }
  }, [miles, category]);

  const onUploadReceipt = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErr("Receipt must be smaller than 5 MB.");
      return;
    }
    setUploading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/receipt", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReceiptUrl(data.url);
      setReceiptPath(data.path);
      setReceiptType(data.content_type);
      toast.success("Receipt attached.");
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const onRemoveReceipt = () => {
    setReceiptUrl(null);
    setReceiptPath(null);
    setReceiptType(null);
  };

  const onSave = async () => {
    setErr("");
    if (!date) return setErr("Please pick a date.");
    if (!description.trim()) return setErr("Please add a description.");
    const a = parseFloat(amount);
    if (!a || isNaN(a)) return setErr("Please enter an amount.");
    setSaving(true);
    try {
      const payload = {
        date,
        amount: a,
        description,
        category,
        miles: miles ? parseFloat(miles) : null,
        irs_rate: category === "Mileage" ? IRS_2026_RATE : null,
        receipt_url: receiptUrl,
        receipt_path: receiptPath,
        receipt_content_type: receiptType,
        notes: notes || null,
      };
      if (editing) {
        await api.put(`/expenses/${editing.id}`, payload);
        toast.success("Expense updated.");
      } else {
        await api.post("/expenses", payload);
        toast.success("Expense added.");
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-testid="expense-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif">{editing ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block mb-1.5">Date</Label>
              <DatePicker value={date} onChange={setDate} clearable={false} data-testid="expense-date" />
            </div>
            <div>
              <Label className="block mb-1.5">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="expense-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="block mb-1.5">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Scopist payment — R. Alvarez" data-testid="expense-desc" />
          </div>
          {category === "Mileage" && (
            <div>
              <Label className="block mb-1.5">Miles</Label>
              <Input type="number" step="any" value={miles} onChange={(e) => setMiles(e.target.value)} data-testid="expense-miles" />
              <div className="text-xs text-stone-500 mt-1">Auto-calculates at IRS standard rate (${IRS_2026_RATE}/mi). Editable below.</div>
            </div>
          )}
          <div>
            <Label className="block mb-1.5">Amount</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="expense-amount" />
          </div>
          <div>
            <Label className="block mb-1.5">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} data-testid="expense-notes" />
          </div>
          <div>
            <Label className="block mb-1.5">Receipt (optional)</Label>
            {receiptUrl ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm" data-testid="expense-receipt-attached">
                <a
                  href={`${API}${receiptUrl.replace(/^\/api/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 underline truncate"
                >
                  {receiptType?.includes("pdf") ? "PDF receipt" : "Image receipt"} — view
                </a>
                <button
                  type="button"
                  onClick={onRemoveReceipt}
                  className="text-red-700 text-xs hover:underline"
                  data-testid="expense-receipt-remove"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                className={`flex items-center gap-2 px-3 py-2 border border-dashed border-stone-300 rounded text-sm cursor-pointer hover:bg-stone-50 ${uploading ? "opacity-60 pointer-events-none" : ""}`}
                data-testid="expense-receipt-dropzone"
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
                  className="hidden"
                  onChange={(e) => onUploadReceipt(e.target.files?.[0])}
                  data-testid="expense-receipt-input"
                />
                <span className="text-stone-600">
                  {uploading ? "Uploading…" : "Attach a receipt (PNG, JPG, WebP, HEIC, or PDF · max 5 MB)"}
                </span>
              </label>
            )}
          </div>
          {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-stone-300" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="expense-save">
            {saving ? "Saving…" : (editing ? "Save changes" : "Add expense")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
