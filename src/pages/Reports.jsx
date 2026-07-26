import { useEffect, useMemo, useState } from "react";
import { api, errMessage, API } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, AlertCircle } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const fmtPct = (n, of) =>
  !of ? "—" : `${((100 * (n || 0)) / of).toFixed(1)}%`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Reports() {
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(null);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/years").then((r) => {
      setYears(r.data);
      setYear(r.data[0] || new Date().getFullYear());
    }).catch((e) => setErr(errMessage(e)));
  }, []);

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    api
      .get("/reports/tax-summary", { params: { year } })
      .then((r) => setData(r.data))
      .catch((e) => setErr(errMessage(e)))
      .finally(() => setLoading(false));
  }, [year]);

  const downloadCsvUrl = useMemo(
    () => (year ? `${API}/reports/tax-summary.csv?year=${year}` : "#"),
    [year]
  );

  const hasData =
    !!data && (data.invoiced_total > 0 || data.expenses_total > 0);

  return (
    <AppShell
      title="Tax report"
      actions={
        <div className="flex items-center gap-2">
          <Select value={String(year || "")} onValueChange={(v) => setYear(parseInt(v, 10))}>
            <SelectTrigger className="w-28" data-testid="reports-year-select">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <a href={downloadCsvUrl}>
            <Button
              variant="outline"
              className="border-stone-300"
              disabled={!data}
              data-testid="reports-csv-btn"
            >
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </a>
        </div>
      }
    >
      {err && (
        <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>
      )}

      {!loading && !hasData ? (
        <div className="bg-white border border-[#E5E1DA] rounded-lg p-10 text-center" data-testid="reports-empty">
          <FileSpreadsheet className="h-10 w-10 mx-auto text-stone-300 mb-3" strokeWidth={1.5} />
          <div className="text-[20px] font-semibold text-[#1F2937] mb-1">
            Nothing to report for {year} yet.
          </div>
          <p className="text-stone-600 max-w-md mx-auto">
            Once you've invoiced or logged expenses in {year}, this page becomes a one-click handoff for your tax accountant.
          </p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Headline metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric label="Invoiced" value={fmt(data.invoiced_total)} testid="report-invoiced" />
            <Metric
              label="Collected (cash basis)"
              value={fmt(data.collected_total)}
              hint={data.collected_total === 0 && data.invoiced_total > 0
                ? "Mark invoices Paid to populate"
                : null}
              testid="report-collected"
              accent="success"
            />
            <Metric label="Expenses" value={fmt(data.expenses_total)} testid="report-expenses" accent="warn" />
            <Metric
              label="Net profit (est.)"
              value={fmt(data.net_profit_estimate)}
              hint="collected − expenses"
              testid="report-net"
              accent={data.net_profit_estimate >= 0 ? "success" : "warn"}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 flex gap-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={2} />
            <span>
              This is a summary for handoff to your tax accountant — not tax advice. Schedule C line numbers are conservative defaults; your accountant may reclassify.
            </span>
          </div>

          {/* Schedule C breakdown */}
          <section className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden" data-testid="reports-schedule-c">
            <header className="px-5 py-4 border-b border-[#E5E1DA]">
              <div className="text-[15px] font-semibold text-[#1F2937]">Expenses — Schedule C, Part II</div>
              <div className="text-xs text-stone-500 mt-0.5">
                {data.mileage_total_miles > 0 && (
                  <>Mileage: <span className="text-[#1F2937] font-medium">{data.mileage_total_miles.toLocaleString()} miles</span></>
                )}
              </div>
            </header>
            <table className="sd-table">
              <thead>
                <tr>
                  <th className="w-14">Line</th>
                  <th>Category</th>
                  <th>Schedule C title</th>
                  <th className="!text-right">Amount</th>
                  <th className="!text-right">% of revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.expense_categories.map((c) => (
                  <tr key={c.category} data-testid={`report-category-${c.category}`}>
                    <td className="tabular text-stone-500">{c.schedule_c_line}</td>
                    <td className="font-medium text-[#1F2937]">{c.category}</td>
                    <td className="text-stone-600 text-xs">{c.schedule_c_title}</td>
                    <td className="text-right tabular font-medium">{fmt(c.amount)}</td>
                    <td className="text-right tabular text-stone-500 text-xs">{fmtPct(c.amount, data.collected_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#1F2937]">
                  <td colSpan={3} className="text-right text-stone-600 pt-2.5 pb-2.5">Total expenses</td>
                  <td className="text-right tabular font-semibold text-[#1F2937] text-[15px]">{fmt(data.expenses_total)}</td>
                  <td className="text-right tabular text-stone-500 text-xs">{fmtPct(data.expenses_total, data.collected_total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly breakdown */}
            <section className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden" data-testid="reports-monthly">
              <div className="px-5 py-4 border-b border-[#E5E1DA]">
                <div className="text-[15px] font-semibold text-[#1F2937]">Monthly breakdown</div>
              </div>
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="!text-right">Invoiced</th>
                    <th className="!text-right">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_month.map((m) => (
                    <tr key={m.month}>
                      <td>{MONTHS[m.month - 1]}</td>
                      <td className="text-right tabular">{m.invoiced ? fmt(m.invoiced) : <span className="text-stone-400">—</span>}</td>
                      <td className="text-right tabular">{m.collected ? fmt(m.collected) : <span className="text-stone-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Top clients */}
            <section className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden" data-testid="reports-top-clients">
              <div className="px-5 py-4 border-b border-[#E5E1DA]">
                <div className="text-[15px] font-semibold text-[#1F2937]">Top clients by invoiced</div>
              </div>
              {data.top_clients.length === 0 ? (
                <div className="px-5 py-10 text-center text-stone-500">No client revenue yet.</div>
              ) : (
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th className="!text-right">Invoiced</th>
                      <th className="!text-right">Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_clients.map((c, i) => (
                      <tr key={`${c.name}-${i}`}>
                        <td className="font-medium text-[#1F2937]">{c.name}</td>
                        <td className="text-right tabular">{fmt(c.invoiced)}</td>
                        <td className="text-right tabular text-stone-600">{fmt(c.collected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Metric({ label, value, hint, testid, accent }) {
  const color =
    accent === "success" ? "text-[#15803D]" :
    accent === "warn" ? "text-[#B45309]" :
    "text-[#1F2937]";
  return (
    <div data-testid={testid} className="bg-white border border-[#E5E1DA] rounded-lg p-5">
      <div className="text-[12px] uppercase tracking-[0.06em] text-[#6B7280] font-semibold mb-2">{label}</div>
      <div className={`text-[28px] font-semibold tracking-tight tabular ${color}`}>{value}</div>
      {hint && <div className="text-[13px] text-[#6B7280] mt-1">{hint}</div>}
    </div>
  );
}
