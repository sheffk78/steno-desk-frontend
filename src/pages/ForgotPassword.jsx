import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, errMessage } from "@/lib/api";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email) { setFieldError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("Enter a valid email address."); return false; }
    setFieldError("");
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Reset link sent — check your email.");
    } catch (e) {
      setErr(errMessage(e));
      toast.error("Could not send reset link. Please try again.");
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
          <h1 className="font-serif text-3xl text-slate-900 dark:text-gray-100 tracking-tight mb-1">Reset password</h1>
          <p className="text-sm text-stone-600 dark:text-gray-400 mb-7">
            Enter the email on your account and we'll send a reset link.
          </p>

          {submitted ? (
            <div
              className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded px-4 py-3 text-sm"
              data-testid="forgot-success"
            >
              If an account exists for <b>{email}</b>, a reset link is on its way.
              The link will expire in 60 minutes.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" data-testid="forgot-form" noValidate>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                  data-testid="forgot-email"
                  aria-invalid={!!fieldError}
                  className={`mt-1 ${fieldError ? "border-red-400" : ""}`}
                />
                {fieldError && (
                  <p className="text-xs text-red-600 mt-1" data-testid="forgot-email-error">{fieldError}</p>
                )}
              </div>
              {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2" data-testid="forgot-error">{err}</div>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                data-testid="forgot-submit"
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-sm text-stone-600 dark:text-gray-400">
            <Link to="/login" className="text-slate-900 dark:text-gray-100 underline underline-offset-2">Back to sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}