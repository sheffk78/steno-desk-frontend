import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { redditTrack } from "@/lib/reddit";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const isBeta = searchParams.get("beta") === "1";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Please use a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name, isBeta);
      // Fire Reddit conversion event (silent if pixel is blocked).
      redditTrack("SignUp", {
        customEventName: isBeta ? "BetaSignUp" : "TrialSignUp",
      });
      navigate("/app/dashboard", { replace: true });
    } catch (e) {
      setErr(e.message);
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
          {isBeta && (
            <div className="mb-5 bg-violet-50 border border-violet-200 rounded-md px-3 py-2 text-sm text-violet-900" data-testid="signup-beta-banner">
              <span className="font-semibold">Beta tester — 60 days free.</span> Welcome aboard.
            </div>
          )}
          <h1 className="font-serif text-3xl text-slate-900 tracking-tight mb-1">Start your free trial</h1>
          <p className="text-sm text-stone-600 mb-7">{isBeta ? "60 days. No credit card. Cancel anytime." : "7 days. No credit card. Cancel anytime."}</p>

          <form onSubmit={onSubmit} className="space-y-4" data-testid="signup-form">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie Chen"
                data-testid="signup-name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="signup-email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="signup-password"
                className="mt-1"
              />
              <div className="text-xs text-stone-500 mt-1">At least 8 characters.</div>
            </div>
            {err && (
              <div
                className="text-sm bg-red-50 border border-red-200 text-red-800 rounded px-3 py-2"
                data-testid="signup-error"
              >
                {err}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              data-testid="signup-submit"
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-stone-600">
            Already have an account?{" "}
            <Link to="/login" className="text-slate-900 underline underline-offset-2" data-testid="signup-to-login">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
