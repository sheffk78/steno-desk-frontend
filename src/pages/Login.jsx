import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors = {};
    if (!email) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Signed in — welcome back to Steno Desk.");
      const from = location.state?.from?.pathname || "/app/dashboard";
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message);
      toast.error("Sign in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col dark:bg-gray-900">
      <header className="border-b border-stone-200 bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link to="/"><Logo className="h-7" /></Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl text-slate-900 dark:text-gray-100 tracking-tight mb-1">Sign in</h1>
          <p className="text-sm text-stone-600 dark:text-gray-400 mb-7">Welcome back to Steno Desk.</p>

          <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: undefined })); }}
                required
                data-testid="login-email"
                aria-invalid={!!fieldErrors.email}
                className={`mt-1 ${fieldErrors.email ? "border-red-400" : ""}`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1" data-testid="login-email-error">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-stone-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200" data-testid="forgot-link">
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: undefined })); }}
                required
                data-testid="login-password"
                aria-invalid={!!fieldErrors.password}
                className={`mt-1 ${fieldErrors.password ? "border-red-400" : ""}`}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1" data-testid="login-password-error">{fieldErrors.password}</p>
              )}
            </div>
            {err && (
              <div
                className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2"
                data-testid="login-error"
              >
                {err}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="login-submit"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-stone-600 dark:text-gray-400">
            New to Steno Desk?{" "}
            <Link to="/signup" className="text-slate-900 dark:text-gray-100 underline underline-offset-2" data-testid="login-to-signup">
              Start your free trial
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
