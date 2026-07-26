import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/DatePicker";
import DeliveryChip from "@/components/DeliveryChip";
import { Plus } from "lucide-react";
import { StatusPill } from "@/pages/Dashboard";

const STATUSES = ["All", "Draft", "Sent", "Paid", "Void"];
const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function Invoices() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [statusF, setStatusF] = useState(params.get("status") || "All");
  const startOfYear = `${new Date().getFullYear()}-01-01`;
  const endOfYear = `${new Date().getFullYear()}-12-31`;
  const [from, setFrom] = useState(params.get("from") || startOfYear);
  const [to, setTo] = useState(params.get("to") || endOfYear);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    // _lookup returns soft-deleted too so historical invoices still render a name.
    api.get("/clients/_lookup").then((r) => setClients(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = {};
        if (statusF !== "All") q.status = statusF;
        const { data } = await api.get("/invoices", { params: q });
        setInvoices(data);
      } catch (e) {
        setErr(errMessage(e));
      }
    };
    fetch();
  }, [statusF]);

  const cn = useMemo(
    () =>
      Object.fromEntries(
        clients.map((c) => [c.id, c.is_deleted ? `${c.name} [Deleted]` : c.name])
      ),
    [clients]
  );

  // Apply date-range filter on the client (backend already filters by status)
  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (!i.invoice_date) return true;
      if (from && i.invoice_date < from) return false;
      if (to && i.invoice_date > to) return false;
      return true;
    });
  }, [invoices, from, to]);

  const totals = useMemo(() => {
    let total = 0, paid = 0, outstanding = 0;
    filtered.forEach((i) => {
      const t = parseFloat(i.total) || 0;
      if (i.status === "Void") return;
      total += t;
      if (i.status === "Paid") paid += t;
      else if (i.status === "Sent" || i.status === "Draft") outstanding += t;
    });
    return { total, paid, outstanding };
  }, [filtered]);

  const onStatusChange = (v) => {
    setStatusF(v);
    if (v === "All") params.delete("status"); else params.set("status", v);
    setParams(params, { replace: true });
  };

  return (
    <AppShell
      title="Invoices"
      actions={
        <Link to="/app/invoices/new">
          <Button className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="invoices-new-btn">
            <Plus className="h-4 w-4 mr-1.5" /> New invoice
          </Button>
        </Link>
      }
    >
      <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E1DA] flex flex-wrap items-end gap-4">
          <div className="w-[180px]">
            <Label className="block mb-1.5 text-[13px] font-semibold text-[#374151]">Status</Label>
            <Select value={statusF} onValueChange={onStatusChange}>
              <SelectTrigger className="h-9" data-testid="invoices-status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block mb-1.5 text-[13px] font-semibold text-[#374151]">From</Label>
            <div className="w-[170px]">
              <DatePicker value={from} onChange={setFrom} placeholder="From date" data-testid="invoices-from" />
            </div>
          </div>
          <div>
            <Label className="block mb-1.5 text-[13px] font-semibold text-[#374151]">To</Label>
            <div className="w-[170px]">
              <DatePicker value={to} onChange={setTo} placeholder="To date" data-testid="invoices-to" />
            </div>
          </div>
        </div>

        {err && <div className="px-5 py-3 text-[14px] bg-[#FEE2E2] text-[#B91C1C] border-b border-[#B91C1C]/30">{err}</div>}

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center" data-testid="invoices-empty">
            <div className="text-[20px] font-semibold text-[#1F2937] mb-1">No invoices in this view.</div>
            <p className="text-[#6B7280] mb-5">Once you complete a job, you can generate an invoice from the job detail page.</p>
            <Link to="/app/invoices/new">
              <Button className="bg-[#1F2937] hover:bg-[#111827] text-white">
                <Plus className="h-4 w-4 mr-1.5" /> Create invoice
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Due</th>
                  <th className="!text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} onClick={() => navigate(`/app/invoices/${i.id}`)} className="cursor-pointer" data-testid={`invoice-row-${i.id}`}>
                    <td className="font-medium text-[#1F2937] tabular">{i.invoice_number}</td>
                    <td>{cn[i.client_id] || i.billed_to_name || (i.client_id ? "[Deleted Client]" : "—")}</td>
                    <td className="tabular text-[#374151]">{fmtDate(i.invoice_date)}</td>
                    <td className="tabular text-[#374151]">{fmtDate(i.due_date)}</td>
                    <td className="text-right tabular font-medium">{fmt(i.total)}</td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusPill status={i.status} />
                        <DeliveryChip invoice={i} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals bar */}
            <div className="px-5 py-4 bg-[#FBFAF7] border-t border-[#E5E1DA] flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <div className="text-[#6B7280]">
                Showing <span className="font-medium text-[#1F2937]">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "invoice" : "invoices"}
              </div>
              <div className="flex flex-wrap items-center gap-6 tabular">
                <div><span className="text-[#6B7280]">Total: </span><span className="font-semibold text-[#1F2937]" data-testid="totals-total">{fmt(totals.total)}</span></div>
                <div><span className="text-[#6B7280]">Paid: </span><span className="font-semibold text-[#15803D]" data-testid="totals-paid">{fmt(totals.paid)}</span></div>
                <div><span className="text-[#6B7280]">Outstanding: </span><span className="font-semibold text-[#B45309]" data-testid="totals-outstanding">{fmt(totals.outstanding)}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
