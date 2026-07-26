import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Briefcase, FileText, Inbox } from "lucide-react";

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [inboxCounts, setInboxCounts] = useState({ ready_jobs: 0, draft_invoices: 0 });
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setData(r.data)).catch((e) => setErr(errMessage(e)));
    api
      .get("/dashboard/inbox")
      .then((r) =>
        setInboxCounts({
          ready_jobs: r.data.ready_jobs?.length || 0,
          draft_invoices: r.data.draft_invoices?.length || 0,
        })
      )
      .catch(() => {});
  }, []);

  if (err) {
    return (
      <AppShell title="Dashboard">
        <div className="bg-[#FEE2E2] border border-[#B91C1C]/30 text-[#B91C1C] rounded-md px-4 py-3">{err}</div>
      </AppShell>
    );
  }
  if (!data) return <AppShell title="Dashboard"><div /></AppShell>;

  const isEmpty =
    !data.billed_this_month &&
    !data.collected_this_month &&
    data.outstanding_count === 0 &&
    (data.upcoming_jobs?.length || 0) === 0 &&
    (data.recent_invoices?.length || 0) === 0;

  return (
    <AppShell
      title="Dashboard"
      actions={
        <>
          <Link to="/app/jobs/new">
            <Button className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="dashboard-new-job">
              <Plus className="h-4 w-4 mr-1.5" /> Add job
            </Button>
          </Link>
        </>
      }
    >
      {isEmpty ? (
        <EmptyDashboard />
      ) : (
        <>
          {/* Inbox suggestions widget — hidden when nothing's queued */}
          {(inboxCounts.ready_jobs > 0 || inboxCounts.draft_invoices > 0) && (
            <Link
              to="/app/inbox"
              data-testid="dashboard-inbox-widget"
              className="block bg-gradient-to-r from-[#FAF3E4] to-white border border-[#D4A056]/40 rounded-lg px-5 py-4 mb-5 hover:border-[#D4A056] hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-white border border-[#D4A056]/40 rounded-md p-2 shrink-0">
                    <Inbox className="h-4 w-4 text-[#B45309]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#1F2937] truncate">
                      {inboxCounts.ready_jobs > 0 && (
                        <>
                          {inboxCounts.ready_jobs} job{inboxCounts.ready_jobs === 1 ? "" : "s"} ready to invoice
                        </>
                      )}
                      {inboxCounts.ready_jobs > 0 && inboxCounts.draft_invoices > 0 && " · "}
                      {inboxCounts.draft_invoices > 0 && (
                        <>
                          {inboxCounts.draft_invoices} draft{inboxCounts.draft_invoices === 1 ? "" : "s"} ready to send
                        </>
                      )}
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5">
                      Bulk-generate or bulk-send from your inbox.
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#B45309] shrink-0" />
              </div>
            </Link>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard testid="metric-billed" label="Billed this month" value={fmtMoney(data.billed_this_month)} />
            <MetricCard testid="metric-collected" label="Collected this month" value={fmtMoney(data.collected_this_month)} accent="success" />
            <MetricCard
              testid="metric-outstanding"
              label="Outstanding"
              value={fmtMoney(data.outstanding_total)}
              hint={`${data.outstanding_count} invoice${data.outstanding_count === 1 ? "" : "s"}`}
              onClick={() => navigate("/app/invoices?status=Sent")}
              accent="warn"
            />
            <MetricCard
              testid="metric-upcoming"
              label="Upcoming jobs"
              value={String(data.upcoming_jobs.length)}
              hint="next 14 days"
              onClick={() => navigate("/app/jobs?status=Scheduled")}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Upcoming jobs */}
            <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
                <div className="text-[15px] font-semibold text-[#1F2937]">Upcoming jobs · next 14 days</div>
                <Link to="/app/jobs" className="text-[13px] text-[#6B7280] hover:text-[#1F2937] inline-flex items-center gap-1">
                  All jobs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {data.upcoming_jobs.length === 0 ? (
                <div className="px-5 py-10 text-center text-[14px] text-[#6B7280]">
                  Nothing on the calendar in the next two weeks.
                </div>
              ) : (
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Witness</th>
                      <th>Client</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upcoming_jobs.map((j) => (
                      <tr
                        key={j.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/app/jobs/${j.id}`)}
                        data-testid={`upcoming-job-row-${j.id}`}
                      >
                        <td className="tabular text-[#374151]">{fmtDate(j.job_date)}</td>
                        <td className="font-medium">{j.witness}</td>
                        <td className="text-[#374151]">{j.client_name || "—"}</td>
                        <td><StatusPill status={j.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent invoices */}
            <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E1DA] flex items-center justify-between">
                <div className="text-[15px] font-semibold text-[#1F2937]">Recent invoices</div>
                <Link to="/app/invoices" className="text-[13px] text-[#6B7280] hover:text-[#1F2937] inline-flex items-center gap-1">
                  All invoices <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {(data.recent_invoices || []).length === 0 ? (
                <div className="px-5 py-10 text-center text-[14px] text-[#6B7280]">
                  No invoices yet.
                </div>
              ) : (
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Client</th>
                      <th className="!text-right">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_invoices.map((i) => (
                      <tr
                        key={i.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/app/invoices/${i.id}`)}
                        data-testid={`recent-invoice-row-${i.id}`}
                      >
                        <td className="tabular font-medium">{i.invoice_number}</td>
                        <td className="text-[#374151]">{i.client_name || "—"}</td>
                        <td className="text-right tabular font-medium">{fmtMoney(i.total)}</td>
                        <td><StatusPill status={i.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function MetricCard({ label, value, hint, onClick, testid, accent }) {
  const Tag = onClick ? "button" : "div";
  const accentColor =
    accent === "success" ? "text-[#15803D]" :
    accent === "warn" ? "text-[#B45309]" :
    "text-[#1F2937]";
  return (
    <Tag
      onClick={onClick}
      data-testid={testid}
      className={`text-left bg-white border border-[#E5E1DA] rounded-lg p-5 ${onClick ? "hover:border-[#D6D3D1] hover:shadow-sm transition-all" : ""}`}
    >
      <div className="text-[12px] uppercase tracking-[0.06em] text-[#6B7280] font-semibold mb-2">{label}</div>
      <div className={`text-[28px] font-semibold tracking-tight tabular ${accentColor}`}>{value}</div>
      {hint && <div className="text-[13px] text-[#6B7280] mt-1">{hint}</div>}
    </Tag>
  );
}

export function StatusPill({ status }) {
  const map = {
    Scheduled: "bg-[#F3F0E9] text-[#1F2937] border-[#E5E1DA]",
    Completed: "bg-[#FAF3E4] text-[#B45309] border-[#D4A056]/40",
    Invoiced:  "bg-[#DBEAFE] text-[#1D4ED8] border-[#1D4ED8]/20",
    Paid:      "bg-[#DCFCE7] text-[#15803D] border-[#15803D]/20",
    Draft:     "bg-[#F3F0E9] text-[#1F2937] border-[#E5E1DA]",
    Sent:      "bg-[#DBEAFE] text-[#1D4ED8] border-[#1D4ED8]/20",
    Void:      "bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/20",
    Overdue:   "bg-[#FEF3C7] text-[#B45309] border-[#B45309]/20",
  };
  return (
    <span className={`inline-flex items-center text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${map[status] || "bg-[#F3F0E9] text-[#1F2937] border-[#E5E1DA]"}`}>
      {status}
    </span>
  );
}

function EmptyDashboard() {
  return (
    <div className="bg-white border border-[#E5E1DA] rounded-lg p-10 max-w-2xl mx-auto text-center" data-testid="dashboard-empty">
      <div className="text-[24px] font-semibold tracking-tight text-[#1F2937] mb-2">Welcome to Steno Desk.</div>
      <p className="text-[16px] text-[#6B7280] mb-7 max-w-md mx-auto leading-relaxed">
        Start with a client, log your first job, and you'll be sending a real
        invoice in about twenty minutes.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center max-w-md mx-auto">
        <Link to="/app/clients/new" className="flex-1">
          <Button variant="outline" className="w-full border-[#E5E1DA] hover:bg-[#F3F0E9]">
            <Briefcase className="h-4 w-4 mr-1.5" /> Add a client
          </Button>
        </Link>
        <Link to="/app/jobs/new" className="flex-1">
          <Button className="w-full bg-[#1F2937] hover:bg-[#111827] text-white">
            <FileText className="h-4 w-4 mr-1.5" /> Add your first job
          </Button>
        </Link>
      </div>
    </div>
  );
}
