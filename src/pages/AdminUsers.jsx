import { useEffect, useMemo, useState } from "react";
import { api, errMessage } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Gift, Plus, ShieldCheck, RefreshCcw, Undo2, Users, Trash2 } from "lucide-react";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const STATUS_STYLE = {
  "Trialing": "bg-amber-50 text-amber-900 border-amber-200",
  "Trial expired": "bg-red-50 text-red-800 border-red-200",
  "Subscribed": "bg-emerald-50 text-emerald-900 border-emerald-200",
  "Beta (comped)": "bg-violet-50 text-violet-900 border-violet-200",
  "Active": "bg-stone-50 text-stone-700 border-stone-200",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState(null); // { kind, user }
  const [extendDays, setExtendDays] = useState("30");
  const [extendUntil, setExtendUntil] = useState("");
  const [compExpires, setCompExpires] = useState("");
  const [busy, setBusy] = useState(false);
  // Multi-select for bulk delete
  const [selected, setSelected] = useState(() => new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const toggleSelected = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAllVisible = () => {
    const visibleIds = users.map((u) => u.id);
    setSelected((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const onBulkDelete = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/admin/users/bulk-delete", {
        user_ids: Array.from(selected),
      });
      setBulkResult(data);
      setSelected(new Set());
      await load();
      if (data.skipped?.length) {
        toast(
          `Deleted ${data.deleted_users} user${data.deleted_users === 1 ? "" : "s"}. ${data.skipped.length} skipped (admin or self).`,
        );
      } else {
        toast.success(`Deleted ${data.deleted_users} user${data.deleted_users === 1 ? "" : "s"}.`);
      }
    } catch (e) {
      toast.error(errMessage(e, "Bulk delete failed."));
    } finally {
      setBusy(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (statusFilter !== "__all__") params.status = statusFilter;
      const [u, s] = await Promise.all([
        api.get("/admin/users", { params }),
        api.get("/admin/stats"),
      ]);
      setUsers(u.data);
      setStats(s.data);
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [q, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const onExtend = async () => {
    if (!actionDialog?.user) return;
    setBusy(true);
    try {
      const payload = extendUntil
        ? { until: extendUntil }
        : { days: parseInt(extendDays, 10) || 0 };
      await api.post(`/admin/users/${actionDialog.user.id}/extend-trial`, payload);
      toast.success(`Trial extended for ${actionDialog.user.email}.`);
      setActionDialog(null);
      load();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onComp = async () => {
    if (!actionDialog?.user) return;
    setBusy(true);
    try {
      const payload = compExpires ? { expires_at: compExpires } : {};
      await api.post(`/admin/users/${actionDialog.user.id}/comp-beta`, payload);
      toast.success(`${actionDialog.user.email} comped as beta tester.`);
      setActionDialog(null);
      load();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (user) => {
    if (!window.confirm(`Revoke beta comp for ${user.email}? They'll be back to trial-expired status.`)) return;
    try {
      await api.post(`/admin/users/${user.id}/revoke-comp`);
      toast.success("Comp revoked.");
      load();
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const openExtend = (user) => {
    setExtendDays("30");
    setExtendUntil("");
    setActionDialog({ kind: "extend", user });
  };
  const openComp = (user) => {
    setCompExpires("");
    setActionDialog({ kind: "comp", user });
  };

  return (
    <AppShell
      title="Admin · Users"
      actions={
        <Button variant="outline" className="border-stone-300" onClick={load} data-testid="admin-refresh">
          <RefreshCcw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      }
    >
      {err && (
        <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6" data-testid="admin-stats">
          <Stat label="Total users" value={stats.total_users} testid="stat-total" />
          <Stat label="Trialing" value={stats.trialing} testid="stat-trialing" />
          <Stat label="Subscribed" value={stats.subscribed} testid="stat-subscribed" />
          <Stat label="Beta (comped)" value={stats.beta} testid="stat-beta" />
          <Stat label="Signups last 7 days" value={stats.signups_last_7_days} testid="stat-signups" />
          {stats.expiring_within_3_days > 0 && (
            <div className="col-span-full bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-900" data-testid="stat-expiring">
              <span className="font-semibold">{stats.expiring_within_3_days}</span> trial{stats.expiring_within_3_days === 1 ? "" : "s"} expiring within 3 days.
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#E5E1DA] rounded-lg p-4 mb-5 flex flex-col sm:flex-row gap-3" data-testid="admin-filters">
        <Input
          placeholder="Search by email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
          data-testid="admin-search"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-56" data-testid="admin-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="expired">Trial expired</SelectItem>
            <SelectItem value="subscribed">Subscribed</SelectItem>
            <SelectItem value="beta">Beta (comped)</SelectItem>
          </SelectContent>
        </Select>
        <div className="sm:ml-auto text-xs text-stone-500 self-center">
          {loading ? "Loading…" : `${users.length} user${users.length === 1 ? "" : "s"}`}
        </div>
        {selected.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkConfirmOpen(true)}
            className="text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800"
            data-testid="admin-bulk-delete-button"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete {selected.size} selected
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden">
        {users.length === 0 && !loading ? (
          <div className="px-5 py-16 text-center text-stone-500" data-testid="admin-empty">
            <Users className="h-8 w-8 mx-auto text-stone-300 mb-2" strokeWidth={1.5} />
            No users match.
          </div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th className="!w-8 !pr-0">
                  <input
                    type="checkbox"
                    aria-label="Select all visible"
                    data-testid="admin-select-all"
                    onChange={toggleAllVisible}
                    checked={users.length > 0 && users.every((u) => selected.has(u.id))}
                    className="h-4 w-4 cursor-pointer"
                  />
                </th>
                <th>Email</th>
                <th>Name</th>
                <th>Status</th>
                <th>Trial ends</th>
                <th>Source</th>
                <th className="!text-right">Jobs</th>
                <th className="!text-right">Invoices</th>
                <th>Signed up</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid={`admin-row-${u.id}`}
                    className={selected.has(u.id) ? "bg-red-50/40" : ""}>
                  <td className="!w-8 !pr-0">
                    <input
                      type="checkbox"
                      aria-label={`Select ${u.email}`}
                      data-testid={`admin-select-${u.id}`}
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelected(u.id)}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="font-medium text-[#1F2937]">{u.email}</td>
                  <td className="text-stone-600">{u.name || "—"}</td>
                  <td>
                    <span className={`text-xs border px-2 py-0.5 rounded ${STATUS_STYLE[u.status] || STATUS_STYLE.Active}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="tabular text-stone-600 text-xs">{fmtDate(u.trial_ends_at)}</td>
                  <td className="text-xs">
                    {u.signup_source === "beta" ? (
                      <span className="text-violet-700 font-medium">beta link</span>
                    ) : <span className="text-stone-500">direct</span>}
                    {u.trial_days_granted && u.trial_days_granted !== 7 && (
                      <span className="ml-1 text-stone-400">({u.trial_days_granted}d)</span>
                    )}
                  </td>
                  <td className="text-right tabular text-stone-600">{u.jobs_count}</td>
                  <td className="text-right tabular text-stone-600">{u.invoices_count}</td>
                  <td className="text-xs text-stone-500 tabular">{fmtDate(u.created_at)}</td>
                  <td className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => openExtend(u)} className="h-7 px-2" data-testid={`admin-extend-${u.id}`}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Extend
                    </Button>
                    {u.subscription_type === "beta" ? (
                      <Button size="sm" variant="ghost" onClick={() => onRevoke(u)} className="h-7 px-2 text-amber-700" data-testid={`admin-revoke-${u.id}`}>
                        <Undo2 className="h-3.5 w-3.5 mr-1" /> Revoke
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => openComp(u)} className="h-7 px-2 text-violet-700" data-testid={`admin-comp-${u.id}`}>
                        <Gift className="h-3.5 w-3.5 mr-1" /> Comp
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Extend dialog */}
      <Dialog open={actionDialog?.kind === "extend"} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="max-w-md" data-testid="extend-dialog">
          <DialogHeader>
            <DialogTitle>Extend trial</DialogTitle>
            <DialogDescription>
              For <span className="font-medium text-[#1F2937]">{actionDialog?.user?.email}</span> · current trial ends {fmtDate(actionDialog?.user?.trial_ends_at)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-stone-500 font-semibold block mb-2">
                Add days
              </label>
              <div className="flex gap-2 flex-wrap">
                {["7", "30", "60", "90"].map((d) => (
                  <Button
                    key={d}
                    variant={extendDays === d && !extendUntil ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setExtendDays(d); setExtendUntil(""); }}
                    className={extendDays === d && !extendUntil ? "bg-[#1F2937] text-white" : "border-stone-300"}
                    data-testid={`extend-days-${d}`}
                  >
                    +{d}d
                  </Button>
                ))}
                <Input
                  type="number"
                  value={extendUntil ? "" : extendDays}
                  onChange={(e) => { setExtendDays(e.target.value); setExtendUntil(""); }}
                  className="w-24"
                  placeholder="custom"
                  data-testid="extend-days-custom"
                />
              </div>
            </div>
            <div className="text-center text-xs text-stone-400">— or —</div>
            <div>
              <label className="text-xs uppercase tracking-wide text-stone-500 font-semibold block mb-2">
                Set absolute end date
              </label>
              <Input
                type="date"
                value={extendUntil}
                onChange={(e) => setExtendUntil(e.target.value)}
                data-testid="extend-until"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={onExtend} disabled={busy} className="bg-[#1F2937] hover:bg-[#111827] text-white" data-testid="extend-confirm">
              {busy ? "Saving…" : "Extend trial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comp dialog */}
      <Dialog open={actionDialog?.kind === "comp"} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="max-w-md" data-testid="comp-dialog">
          <DialogHeader>
            <DialogTitle>Comp as beta tester</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-[#1F2937]">{actionDialog?.user?.email}</span> won&apos;t see the trial banner and the app will treat them as paid until the date below (or forever if blank).
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-xs uppercase tracking-wide text-stone-500 font-semibold block mb-2">
              Expires on (optional — blank = unlimited)
            </label>
            <Input
              type="date"
              value={compExpires}
              onChange={(e) => setCompExpires(e.target.value)}
              data-testid="comp-expires"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={onComp} disabled={busy} className="bg-violet-700 hover:bg-violet-800 text-white" data-testid="comp-confirm">
              <Gift className="h-4 w-4 mr-1.5" /> {busy ? "Saving…" : "Comp as beta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation */}
      <Dialog open={bulkConfirmOpen} onOpenChange={(o) => { if (!o) { setBulkConfirmOpen(false); setBulkResult(null); }}}>
        <DialogContent className="max-w-lg" data-testid="bulk-delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} user{selected.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              This permanently removes the selected accounts and ALL their data —
              jobs, invoices, clients, attorneys, scopists, templates,
              recurring schedules, and expenses. This cannot be undone.
              <br /><br />
              <span className="text-stone-700">
                Admin accounts (including yourself) will be automatically skipped.
              </span>
            </DialogDescription>
          </DialogHeader>
          {bulkResult && (
            <div className="text-xs bg-stone-50 border border-stone-200 rounded p-3 space-y-1" data-testid="bulk-delete-result">
              <div><span className="text-stone-500">Deleted:</span> <span className="font-medium">{bulkResult.deleted_users} user{bulkResult.deleted_users === 1 ? "" : "s"}</span></div>
              {bulkResult.skipped?.length > 0 && (
                <div><span className="text-stone-500">Skipped:</span> {bulkResult.skipped.map((s) => `${s.email} (${s.reason})`).join(", ")}</div>
              )}
              {Object.keys(bulkResult.owned_data_removed || {}).length > 0 && (
                <div>
                  <span className="text-stone-500">Owned data removed:</span>{" "}
                  {Object.entries(bulkResult.owned_data_removed).map(([k, v]) => `${v} ${k}`).join(", ")}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {!bulkResult ? (
              <>
                <Button variant="outline" onClick={() => setBulkConfirmOpen(false)} className="border-stone-300">Cancel</Button>
                <Button
                  onClick={onBulkDelete}
                  disabled={busy}
                  className="bg-red-700 hover:bg-red-800 text-white"
                  data-testid="bulk-delete-confirm"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {busy ? "Deleting…" : `Delete ${selected.size} user${selected.size === 1 ? "" : "s"}`}
                </Button>
              </>
            ) : (
              <Button onClick={() => { setBulkConfirmOpen(false); setBulkResult(null); }} className="bg-[#1F2937] hover:bg-[#111827] text-white">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Stat({ label, value, testid }) {
  return (
    <div className="bg-white border border-[#E5E1DA] rounded-lg p-4" data-testid={testid}>
      <div className="text-[11px] uppercase tracking-[0.06em] text-[#6B7280] font-semibold mb-1.5">{label}</div>
      <div className="text-[24px] font-semibold text-[#1F2937] tabular">{value}</div>
    </div>
  );
}
