import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import "@/App.css";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SkipToContent from "@/components/SkipToContent";
import CookieBanner from "@/components/CookieBanner";
import { captureUTM } from "@/lib/utm";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import Dashboard from "@/pages/Dashboard";
import InboxPage from "@/pages/Inbox";
import Jobs from "@/pages/Jobs";
import JobForm from "@/pages/JobForm";
import Invoices from "@/pages/Invoices";
import InvoiceBuilder from "@/pages/InvoiceBuilder";
import Clients from "@/pages/Clients";
import ClientForm from "@/pages/ClientForm";
import ClientDetail from "@/pages/ClientDetail";
import Expenses from "@/pages/Expenses";
import Reports from "@/pages/Reports";
import AdminUsers from "@/pages/AdminUsers";
import Scopists from "@/pages/Scopists";
import Templates from "@/pages/Templates";
import Recurring from "@/pages/Recurring";
import SettingsPage from "@/pages/Settings";
import PortalInvoice from "@/pages/PortalInvoice";
import PortalScopist from "@/pages/PortalScopist";

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
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/inbox"
            element={
              <ProtectedRoute>
                <InboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/jobs/new"
            element={
              <ProtectedRoute>
                <JobForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/jobs/:id"
            element={
              <ProtectedRoute>
                <JobForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/invoices"
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/invoices/new"
            element={
              <ProtectedRoute>
                <InvoiceBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/invoices/:id"
            element={
              <ProtectedRoute>
                <InvoiceBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/clients/new"
            element={
              <ProtectedRoute>
                <ClientForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/clients/:id/edit"
            element={
              <ProtectedRoute>
                <ClientForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/clients/:id"
            element={
              <ProtectedRoute>
                <ClientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/scopists"
            element={
              <ProtectedRoute>
                <Scopists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/templates"
            element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/recurring"
            element={
              <ProtectedRoute>
                <Recurring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;