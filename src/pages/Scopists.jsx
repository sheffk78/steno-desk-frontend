import { useEffect, useState } from "react";
import { api, errMessage, API } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy, RefreshCcw, Trash2, ExternalLink, Pencil } from "lucide-react";

const fmt$ = (n) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const portalUrl = (token) => `${window.location.origin}/portal/scopist/${token}`;

export default function Scopists() {
  const [scopists, setScopists] = useState([]);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", rate_per_page: "", notes: "" });

  const load = () =>
    api.get("/scopists").then((r) => setScopists(r.data)).catch((e) => setErr(errMessage(e)));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ first_name: "", last_name: "", email: "", rate_per_page: "", notes: "" });
    setOpen(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      first_name: s.first_name || "",
      last_name: s.last_name || "",
      email: s.email || "",
      rate_per_page: s.rate_per_page ?? "",
      notes: s.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      rate_per_page: form.rate_per_page === "" ? null : parseFloat(form.rate_per_page),
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await api.put(`/scopists/${editing.id}`, payload);
        toast.success("Scopist updated.");
      } else {
        await api.post("/scopists", payload);
        toast.success("Scopist added.");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.first_name} ${s.last_name}? Their assignments will be unassigned.`)) return;
    await api.delete(`/scopists/${s.id}`);
    toast.success("Scopist removed.");
    load();
  };

  const regen = async (s) => {
    if (!window.confirm("Regenerate share link? The current link will stop working immediately.")) return;
    try {
      await api.post(`/scopists/${s.id}/regenerate-token`);
      toast.success("New share link generated.");
      load();
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const copyLink = (s) => {
    navigator.clipboard.writeText(portalUrl(s.share_token));
    toast.success("Share link copied.");
  };

  return (
    <AppShell
      title="Scopists"
      actions={
        <Button onClick={openNew} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="scopists-new-btn">
          <Plus className="h-4 w-4 mr-1.5" /> Add scopist
        </Button>
      }
    >
      {err && (
        <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>
      )}

      <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
        {scopists.length === 0 ? (
          <div className="px-5 py-16 text-center" data-testid="scopists-empty">
            <div className="text-[20px] font-semibold text-[#1F2937] mb-1">No scopists yet.</div>
            <p className="text-stone-600 mb-5">
              Add your scopists, assign them to jobs, then send each one their own private work-list link — no login required.
            </p>
            <Button onClick={openNew} className="bg-[#1F2937] hover:bg-[#111827] text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Add your first scopist
            </Button>
          </div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Rate / page</th>
                <th>Open jobs</th>
                <th>Share link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scopists.map((s) => (
                <tr key={s.id} data-testid={`scopist-row-${s.id}`}>
                  <td className="font-medium text-[#1F2937]">{s.first_name} {s.last_name}</td>
                  <td className="text-stone-600">{s.email || "—"}</td>
                  <td className="tabular text-stone-600">{fmt$(s.rate_per_page)}</td>
                  <td className="tabular">{s.open_jobs || 0}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => copyLink(s)} data-testid={`scopist-copy-${s.id}`} className="h-7 px-2">
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                      <a href={portalUrl(s.share_token)} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 px-2" data-testid={`scopist-open-${s.id}`}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => regen(s)} data-testid={`scopist-regen-${s.id}`} className="h-7 px-2 text-amber-700">
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                  <td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="h-7 px-2" data-testid={`scopist-edit-${s.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(s)} className="h-7 px-2 text-red-700" data-testid={`scopist-delete-${s.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit scopist" : "Add scopist"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this scopist's details." : "We'll generate a private share link for them so they can see assigned jobs without logging in."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block mb-1.5">First name *</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} data-testid="scopist-first-name" />
              </div>
              <div>
                <Label className="block mb-1.5">Last name *</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} data-testid="scopist-last-name" />
              </div>
            </div>
            <div>
              <Label className="block mb-1.5">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="scopist-email" />
            </div>
            <div>
              <Label className="block mb-1.5">Rate per page</Label>
              <Input type="number" step="0.01" value={form.rate_per_page} onChange={(e) => setForm({ ...form, rate_per_page: e.target.value })} placeholder="0.85" data-testid="scopist-rate" />
            </div>
            <div>
              <Label className="block mb-1.5">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="scopist-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="scopist-save">
              {editing ? "Save changes" : "Add scopist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
