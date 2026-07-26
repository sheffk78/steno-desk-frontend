import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { StatusPill } from "@/pages/Dashboard";

const STATUSES = ["All", "Scheduled", "Completed", "Invoiced", "Paid"];

export default function Jobs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialStatus = params.get("status") || "All";
  const [statusF, setStatusF] = useState(initialStatus);
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    // _lookup returns all clients (incl. soft-deleted) so historical jobs still
    // resolve to a name. Live list still filters via /clients.
    api.get("/clients/_lookup").then((r) => setClients(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = {};
        if (statusF !== "All") params.status = statusF;
        if (q) params.q = q;
        const { data } = await api.get("/jobs", { params });
        setJobs(data);
      } catch (e) {
        setErr(errMessage(e));
      }
    };
    fetch();
  }, [statusF, q]);

  const clientName = useMemo(() => {
    const m = {};
    clients.forEach((c) => (m[c.id] = c.is_deleted ? `${c.name} [Deleted]` : c.name));
    return m;
  }, [clients]);

  const onStatusChange = (v) => {
    setStatusF(v);
    if (v === "All") {
      params.delete("status");
    } else {
      params.set("status", v);
    }
    setParams(params, { replace: true });
  };

  return (
    <AppShell
      title="Jobs"
      actions={
        <Link to="/app/jobs/new">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="jobs-new-btn">
            <Plus className="h-4 w-4 mr-1.5" /> New job
          </Button>
        </Link>
      }
    >
      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by witness or case…"
              className="pl-9 h-9"
              data-testid="jobs-search"
            />
          </div>
          <div className="w-[180px]">
            <Select value={statusF} onValueChange={onStatusChange}>
              <SelectTrigger className="h-9" data-testid="jobs-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {err && <div className="px-4 py-3 text-sm bg-red-50 text-red-800 border-b border-red-200">{err}</div>}

        {jobs.length === 0 ? (
          <div className="px-4 py-16 text-center" data-testid="jobs-empty">
            <div className="font-serif text-xl text-slate-900 mb-1">No jobs yet.</div>
            <p className="text-stone-600 mb-5">Log your first depo and you'll be 5 minutes from your first invoice.</p>
            <Link to="/app/jobs/new">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-4 w-4 mr-1.5" /> Add your first job
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full sd-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Witness</th>
                <th>Case</th>
                <th>Client</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  onClick={() => navigate(`/app/jobs/${j.id}`)}
                  className="cursor-pointer"
                  data-testid={`job-row-${j.id}`}
                >
                  <td className="font-mono text-xs text-slate-700">{j.job_date}</td>
                  <td className="font-medium text-slate-900">{j.witness}</td>
                  <td className="text-stone-600">{j.case_caption || "—"}</td>
                  <td>{clientName[j.client_id] || "—"}</td>
                  <td>{j.job_type}</td>
                  <td><StatusPill status={j.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
