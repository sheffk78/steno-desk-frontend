import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FilePlus, Trash2, Pencil } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [err, setErr] = useState("");

  const load = () =>
    api.get("/templates").then((r) => setTemplates(r.data)).catch((e) => setErr(errMessage(e)));

  useEffect(() => {
    load();
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
  }, []);

  const cn = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);

  const create = async (t) => {
    try {
      const { data } = await api.post(`/templates/${t.id}/create-invoice`);
      toast.success(`Draft invoice ${data.invoice_number} created.`);
      navigate(`/app/invoices/${data.id}`);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    await api.delete(`/templates/${t.id}`);
    toast.success("Template deleted.");
    load();
  };

  return (
    <AppShell title="Invoice templates">
      {err && <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>}

      <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
        {templates.length === 0 ? (
          <div className="px-5 py-16 text-center" data-testid="templates-empty">
            <div className="text-[20px] font-semibold text-[#1F2937] mb-1">No templates yet.</div>
            <p className="text-stone-600 mb-5">
              On any invoice, click <span className="font-medium">Save as template</span> to keep a reusable copy of its line items and notes for repeat clients.
            </p>
          </div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th>Lines</th>
                <th className="!text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => {
                const sum = (t.line_items || []).reduce((a, li) => a + (parseFloat(li.amount) || 0), 0);
                return (
                  <tr key={t.id} data-testid={`template-row-${t.id}`}>
                    <td className="font-medium text-[#1F2937]">{t.name}</td>
                    <td className="text-stone-600">{cn[t.client_id] || "—"}</td>
                    <td className="text-stone-600">{(t.line_items || []).length}</td>
                    <td className="text-right tabular font-medium">{fmt(sum)}</td>
                    <td className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => create(t)}
                        className="bg-[#1F2937] hover:bg-[#111827] text-white h-7"
                        data-testid={`template-create-${t.id}`}
                        disabled={!t.client_id}
                        title={!t.client_id ? "Set a client on this template first" : ""}
                      >
                        <FilePlus className="h-3.5 w-3.5 mr-1" /> New invoice
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(t)} className="h-7 px-2 text-red-700" data-testid={`template-delete-${t.id}`}>
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
    </AppShell>
  );
}
