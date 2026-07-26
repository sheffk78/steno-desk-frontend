import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api, errMessage } from "@/lib/api";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Please use a password of at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords don't match.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: pw });
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
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
          <h1 className="font-serif text-3xl text-slate-900 tracking-tight mb-1">Set a new password</h1>
          <p className="text-sm text-stone-600 mb-7">Choose something at least 8 characters long.</p>

          {!token ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded px-4 py-3 text-sm">
              That reset link is missing its token. Please request a new link.
            </div>
          ) : done ? (
            <div
              className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded px-4 py-3 text-sm"
              data-testid="reset-success"
            >
              Password updated. Redirecting you to sign in…
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" data-testid="reset-form">
              <div>
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} data-testid="reset-pw" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="pw2">Confirm new password</Label>
                <Input id="pw2" type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} data-testid="reset-pw2" className="mt-1" />
              </div>
              {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2">{err}</div>}
              <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white" data-testid="reset-submit">
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
