import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/clients").then((r) => setClients(r.data)).catch((e) => setErr(errMessage(e)));
  }, []);

  return (
    <AppShell
      title="Clients"
      actions={
        <Link to="/app/clients/new">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="clients-new-btn">
            <Plus className="h-4 w-4 mr-1.5" /> Add client
          </Button>
        </Link>
      }
    >
      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        {err && <div className="px-4 py-3 text-sm bg-red-50 text-red-800 border-b border-red-200">{err}</div>}
        {clients.length === 0 ? (
          <div className="px-4 py-16 text-center" data-testid="clients-empty">
            <div className="font-serif text-xl text-slate-900 mb-1">No clients yet.</div>
            <p className="text-stone-600 mb-5">Add your agencies and law firms — once their rates are saved, every invoice fills itself in.</p>
            <Link to="/app/clients/new">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-4 w-4 mr-1.5" /> Add your first client
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full sd-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Jobs</th>
                <th>Last job</th>
                <th>Default original</th>
                <th>Default copy</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/app/clients/${c.id}`)} className="cursor-pointer" data-testid={`client-row-${c.id}`}>
                  <td className="font-medium text-slate-900">{c.name}</td>
                  <td>{c.type}</td>
                  <td className="font-mono text-xs">{c.job_count}</td>
                  <td className="font-mono text-xs">{c.last_job_date || "—"}</td>
                  <td className="font-mono text-xs">{c.rates?.original_per_page ? `$${c.rates.original_per_page.toFixed(2)}/pg` : "—"}</td>
                  <td className="font-mono text-xs">{c.rates?.copy_per_page ? `$${c.rates.copy_per_page.toFixed(2)}/pg` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
