import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Download, FileText, AlertTriangle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export default function PortalInvoice() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/portal/invoice/${token}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || "This link is invalid or has been revoked."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#FBFAF7] flex items-center justify-center text-stone-500" data-testid="portal-loading">
        Loading invoice…
      </div>
    );

  if (err)
    return (
      <div className="min-h-screen bg-[#FBFAF7] flex items-center justify-center px-6">
        <div className="max-w-md text-center" data-testid="portal-error">
          <AlertTriangle className="h-10 w-10 mx-auto text-amber-600 mb-3" strokeWidth={1.5} />
          <h1 className="text-2xl font-semibold text-[#1F2937] mb-2">Link unavailable</h1>
          <p className="text-stone-600">{err}</p>
        </div>
      </div>
    );

  const { invoice, reporter, client_name } = data;
  const reporterAddr = [
    reporter?.address_line1,
    reporter?.address_line2,
    [reporter?.city, reporter?.state].filter(Boolean).join(", "),
    reporter?.zip,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-[#FBFAF7] py-12 px-4">
      <div className="max-w-3xl mx-auto" data-testid="portal-invoice">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-stone-500 text-sm">Invoice from {reporter?.business_name || reporter?.name || "your court reporter"}</div>
          <a href={`${API}/portal/invoice/${token}/pdf`} target="_blank" rel="noreferrer">
            <Button className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="portal-download-pdf">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </a>
        </div>

        {/* invoice card */}
        <div className="bg-white border border-[#E5E1DA] rounded-lg shadow-sm p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-[#E5E1DA]">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-1">Invoice</div>
              <h1 className="text-3xl font-semibold tabular-nums text-[#1F2937]" data-testid="portal-invoice-number">
                {invoice.invoice_number}
              </h1>
              <div className="mt-3 text-sm text-stone-600 space-y-0.5">
                <div>Date: <span className="text-[#1F2937] font-medium">{fmtDate(invoice.invoice_date)}</span></div>
                <div>Due: <span className="text-[#1F2937] font-medium">{fmtDate(invoice.due_date)}</span></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-1">Total due</div>
              <div className="text-3xl font-semibold tabular-nums text-[#1F2937]" data-testid="portal-total">{fmt(invoice.total)}</div>
              {invoice.status === "Paid" && (
                <div className="mt-2 inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-xs font-medium">
                  Paid {fmtDate(invoice.paid_at)}
                </div>
              )}
            </div>
          </div>

          {/* Bill to / from */}
          <div className="grid sm:grid-cols-2 gap-8 py-6 border-b border-[#E5E1DA]">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-2">Bill to</div>
              <div className="text-[#1F2937] font-medium">{invoice.billed_to_name || client_name}</div>
              {invoice.billed_to_address && (
                <div className="text-sm text-stone-600 whitespace-pre-line mt-1">{invoice.billed_to_address}</div>
              )}
              {invoice.billed_to_email && <div className="text-sm text-stone-600 mt-1">{invoice.billed_to_email}</div>}
            </div>
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-2">From</div>
              <div className="text-[#1F2937] font-medium">{reporter?.business_name || reporter?.name}</div>
              {reporter?.business_name && reporter?.name && (
                <div className="text-sm text-stone-600">{reporter.name}</div>
              )}
              {reporterAddr && <div className="text-sm text-stone-600 mt-1">{reporterAddr}</div>}
              {reporter?.phone && <div className="text-sm text-stone-600">{reporter.phone}</div>}
              {reporter?.email && <div className="text-sm text-stone-600">{reporter.email}</div>}
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-sm mt-6" data-testid="portal-line-items">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                <th className="text-left pb-2 font-semibold">Item</th>
                <th className="text-right pb-2 font-semibold w-24">Qty</th>
                <th className="text-right pb-2 font-semibold w-28">Rate</th>
                <th className="text-right pb-2 font-semibold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.line_items || []).map((li, i) => (
                <tr key={i} className="border-t border-[#E5E1DA]">
                  <td className="py-2.5">
                    <div className="font-medium text-[#1F2937]">{li.label}</div>
                    {li.detail && <div className="text-stone-500 text-xs">{li.detail}</div>}
                  </td>
                  <td className="text-right tabular-nums text-stone-600">{li.quantity ?? "—"}</td>
                  <td className="text-right tabular-nums text-stone-600">{li.rate != null ? fmt(li.rate) : "—"}</td>
                  <td className="text-right tabular-nums font-medium text-[#1F2937]">{fmt(li.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#1F2937]">
                <td colSpan={3} className="text-right pt-3 text-stone-600">Total</td>
                <td className="text-right pt-3 font-semibold text-lg tabular-nums text-[#1F2937]">{fmt(invoice.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Notes / payment */}
          {(invoice.notes || invoice.payment_instructions) && (
            <div className="mt-8 pt-6 border-t border-[#E5E1DA] space-y-4">
              {invoice.notes && (
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 whitespace-pre-line">{invoice.notes}</div>
                </div>
              )}
              {invoice.payment_instructions && (
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-1">Payment instructions</div>
                  <div className="text-sm text-stone-700 whitespace-pre-line">{invoice.payment_instructions}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-stone-500 mt-8 flex items-center justify-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Powered by Steno Desk
        </div>
      </div>
    </div>
  );
}
