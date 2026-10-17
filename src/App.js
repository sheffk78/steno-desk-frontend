import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "sonner";
import "@/App.css";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SkipToContent from "@/components/SkipToContent";
import CookieBanner from "@/components/CookieBanner";
import ExitIntentFeedback from "@/components/ExitIntentFeedback";
import { captureUTM } from "@/lib/utm";

// Route-level code splitting: each page loads only the code its URL needs,
// so the public marketing pages don't download the entire app engine.
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const InboxPage = lazy(() => import("@/pages/Inbox"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const JobForm = lazy(() => import("@/pages/JobForm"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const InvoiceBuilder = lazy(() => import("@/pages/InvoiceBuilder"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientForm = lazy(() => import("@/pages/ClientForm"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const Reports = lazy(() => import("@/pages/Reports"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const Scopists = lazy(() => import("@/pages/Scopists"));
const Templates = lazy(() => import("@/pages/Templates"));
const Recurring = lazy(() => import("@/pages/Recurring"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const PortalInvoice = lazy(() => import("@/pages/PortalInvoice"));
const PortalScopist = lazy(() => import("@/pages/PortalScopist"));

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        minHeight: "60vh",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#667",
      }}
    >
      Loading…
    </div>
  );
}

function App() {
  useEffect(() => {
    // Capture UTM params on first load
    captureUTM();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <SkipToContent />
        <Toaster position="top-right" richColors />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public portals (no auth, magic-link) */}
            <Route path="/portal/invoice/:token" element={<PortalInvoice />} />
            <Route path="/portal/scopist/:token" element={<PortalScopist />} />

            {/* App (protected) */}
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
            <Route path="/app/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/app/jobs/new" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
            <Route path="/app/jobs/:id" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
            <Route path="/app/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/app/invoices/new" element={<ProtectedRoute><InvoiceBuilder /></ProtectedRoute>} />
            <Route path="/app/invoices/:id" element={<ProtectedRoute><InvoiceBuilder /></ProtectedRoute>} />
            <Route path="/app/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/app/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
            <Route path="/app/clients/:id/edit" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
            <Route path="/app/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
            <Route path="/app/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/app/scopists" element={<ProtectedRoute><Scopists /></ProtectedRoute>} />
            <Route path="/app/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/app/recurring" element={<ProtectedRoute><Recurring /></ProtectedRoute>} />
            <Route path="/app/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/app/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <CookieBanner />
        <ExitIntentFeedback />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;