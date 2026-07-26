import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import TrialBanner from "@/components/TrialBanner";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  FileText,
  Users,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  UserCheck,
  FileStack,
  Repeat,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";

const SUPPORT_EMAIL = "support@stenodesk.co";

const baseNav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/app/inbox", label: "Inbox", icon: Inbox, testid: "nav-inbox" },
  { to: "/app/jobs", label: "Jobs", icon: Briefcase, testid: "nav-jobs" },
  { to: "/app/invoices", label: "Invoices", icon: FileText, testid: "nav-invoices" },
  { to: "/app/templates", label: "Templates", icon: FileStack, testid: "nav-templates" },
  { to: "/app/recurring", label: "Recurring", icon: Repeat, testid: "nav-recurring" },
  { to: "/app/clients", label: "Clients", icon: Users, testid: "nav-clients" },
  { to: "/app/scopists", label: "Scopists", icon: UserCheck, testid: "nav-scopists" },
  { to: "/app/expenses", label: "Expenses", icon: Receipt, testid: "nav-expenses" },
  { to: "/app/reports", label: "Reports", icon: BarChart3, testid: "nav-reports" },
  { to: "/app/settings", label: "Settings", icon: Settings, testid: "nav-settings" },
];
const adminNavItem = {
  to: "/app/admin/users", label: "Admin", icon: ShieldCheck, testid: "nav-admin",
};

export default function AppShell({ title, actions, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.is_admin ? [...baseNav, adminNavItem] : baseNav;

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  const trialDaysLeft = (() => {
    if (!user?.trial_ends_at) return null;
    const ms = new Date(user.trial_ends_at) - new Date();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="min-h-screen flex bg-[#FAFAF9]">
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 border-r border-stone-200 bg-white flex flex-col"
        data-testid="app-sidebar"
      >
        <div className="px-5 py-5 border-b border-stone-200">
          <Link to="/app/dashboard" className="block">
            <Logo className="h-7" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app/dashboard"}
                data-testid={item.testid}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-stone-100 text-slate-900 font-medium"
                      : "text-stone-600 hover:bg-stone-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.7} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-200 text-xs text-stone-500">
          <div className="font-medium text-stone-800 truncate" data-testid="sidebar-user-name">
            {user?.name || user?.email}
          </div>
          <div className="truncate">{user?.email}</div>
          {trialDaysLeft !== null && trialDaysLeft >= 0 && (
            <div
              className="mt-2 inline-block bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px]"
              data-testid="trial-badge"
            >
              {trialDaysLeft} days left in trial
            </div>
          )}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Steno%20Desk%20support`}
            data-testid="contact-support-link"
            className="mt-2 w-full flex items-center gap-2 px-2 py-1.5 rounded text-stone-600 hover:bg-stone-100 hover:text-slate-900 transition-colors text-[13px]"
          >
            <LifeBuoy className="h-3.5 w-3.5" /> Contact support
          </a>
          <button
            onClick={onLogout}
            data-testid="logout-button"
            className="mt-1 w-full flex items-center gap-2 px-2 py-1.5 rounded text-stone-600 hover:bg-stone-100 hover:text-slate-900 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <TrialBanner />
        <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h1
            className="font-serif text-2xl text-slate-900 tracking-tight"
            data-testid="page-title"
          >
            {title}
          </h1>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
