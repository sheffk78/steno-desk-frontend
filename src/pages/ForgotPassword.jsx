import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (e) {
      setErr(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link to="/"><Logo className="h-7" /></Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl text-slate-900 tracking-tight mb-1">Reset password</h1>
          <p className="text-sm text-stone-600 mb-7">
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
            <form onSubmit={onSubmit} className="space-y-4" data-testid="forgot-form">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="forgot-email"
                  className="mt-1"
                />
              </div>
              {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>}
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

          <div className="mt-6 text-sm text-stone-600">
            <Link to="/login" className="text-slate-900 underline underline-offset-2">Back to sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
