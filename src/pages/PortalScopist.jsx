import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle, AlertTriangle, Briefcase } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const STATUS_BADGE = {
  Assigned: "bg-amber-50 text-amber-900 border-amber-200",
  "In Progress": "bg-blue-50 text-blue-800 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export default function PortalScopist() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    axios
      .get(`${API}/portal/scopist/${token}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || "This link is invalid or has been revoked."))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [token]);

  const act = async (job_id, kind) => {
    setBusyId(job_id);
    try {
      await axios.post(`${API}/portal/scopist/${token}/jobs/${job_id}/${kind}`);
      toast.success(kind === "start" ? "Marked in progress." : "Marked complete.");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Couldn't update job.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#FBFAF7] flex items-center justify-center text-stone-500" data-testid="scopist-portal-loading">
        Loading your jobs…
      </div>
    );

  if (err)
    return (
      <div className="min-h-screen bg-[#FBFAF7] flex items-center justify-center px-6">
        <div className="max-w-md text-center" data-testid="scopist-portal-error">
          <AlertTriangle className="h-10 w-10 mx-auto text-amber-600 mb-3" strokeWidth={1.5} />
          <h1 className="text-2xl font-semibold text-[#1F2937] mb-2">Link unavailable</h1>
          <p className="text-stone-600">{err}</p>
        </div>
      </div>
    );

  const { scopist, reporter, jobs = [] } = data || {};
  const open = jobs.filter((j) => j.scopist_status !== "Completed");
  const done = jobs.filter((j) => j.scopist_status === "Completed");

  return (
    <div className="min-h-screen bg-[#FBFAF7] py-10 px-4">
      <div className="max-w-4xl mx-auto" data-testid="scopist-portal">
        <header className="mb-8">
          <div className="text-[11px] tracking-[0.18em] uppercase text-stone-500 mb-1">Scopist work list</div>
          <h1 className="text-3xl font-semibold text-[#1F2937]">
            Hi, {scopist?.first_name}.
          </h1>
          <p className="text-stone-600 mt-1">
            From {reporter?.business_name || reporter?.name || "your reporter"} · {open.length} open · {done.length} completed
          </p>
        </header>

        {/* Open jobs */}
        <section className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-[#E5E1DA] text-[11px] tracking-[0.18em] uppercase text-stone-500">
            Open jobs
          </div>
          {open.length === 0 ? (
            <div className="px-5 py-12 text-center" data-testid="scopist-empty">
              <Briefcase className="h-8 w-8 mx-auto text-stone-300 mb-2" strokeWidth={1.5} />
              <div className="text-stone-500">All caught up — no open scoping work.</div>
            </div>
          ) : (
            <ul className="divide-y divide-[#E5E1DA]">
              {open.map((j) => (
                <li key={j.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" data-testid={`scopist-job-${j.id}`}>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1F2937]">{j.case_caption || j.witness}</div>
                    <div className="text-sm text-stone-600">
                      {j.witness && <>Witness: <span className="text-[#1F2937]">{j.witness}</span> · </>}
                      {fmtDate(j.job_date)}
                      {j.client_name && <> · {j.client_name}</>}
                    </div>
                    {j.case_number && <div className="text-xs text-stone-500 font-mono mt-0.5">{j.case_number}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-block text-xs border px-2 py-0.5 rounded ${STATUS_BADGE[j.scopist_status] || "bg-stone-50 text-stone-700 border-stone-200"}`}>
                      {j.scopist_status || "Assigned"}
                    </span>
                    {j.scopist_status !== "In Progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === j.id}
                        onClick={() => act(j.id, "start")}
                        data-testid={`scopist-start-${j.id}`}
                        className="border-stone-300"
                      >
                        <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={busyId === j.id}
                      onClick={() => act(j.id, "complete")}
                      data-testid={`scopist-complete-${j.id}`}
                      className="bg-[#1F2937] hover:bg-[#111827] text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark done
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Completed */}
        {done.length > 0 && (
          <section className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E1DA] text-[11px] tracking-[0.18em] uppercase text-stone-500">
              Recently completed
            </div>
            <ul className="divide-y divide-[#E5E1DA]">
              {done.slice(0, 20).map((j) => (
                <li key={j.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-[#1F2937] truncate">{j.case_caption || j.witness}</div>
                    <div className="text-stone-500 text-xs">
                      {fmtDate(j.job_date)} · Completed {fmtDate(j.scoping_completed_at)}
                    </div>
                  </div>
                  <span className={`text-xs border px-2 py-0.5 rounded ${STATUS_BADGE.Completed}`}>Completed</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="text-center text-xs text-stone-500 mt-8">Powered by Steno Desk</div>
      </div>
    </div>
  );
}
