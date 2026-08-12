import { useState } from "react";
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
  const isFounding = searchParams.get("founding") === "1";
  const isBeta = searchParams.get("beta") === "1";
  // Treat either beta=1 or founding=1 as founding user for trial/benefit purposes.
  const isFoundingUser = isFounding || isBeta;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Please use a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name, isFoundingUser);
      // Fire Reddit conversion event (silent if pixel is blocked).
      redditTrack("SignUp", {
        customEventName: isFoundingUser ? "FoundingUserSignUp" : "TrialSignUp",
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
          {isFoundingUser && (
            <div className="mb-5 bg-[#FAF3E4] border border-[#D4A056]/40 rounded-md px-3 py-2 text-sm text-[#B45309]" data-testid="signup-founding-banner">
              <span className="font-semibold">Founding User — 60 days free.</span> Welcome aboard.
            </div>
          )}
          <h1 className="font-serif text-3xl text-slate-900 tracking-tight mb-1">Start your free trial</h1>
          <p className="text-sm text-stone-600 mb-7">
            {isFoundingUser
              ? "60 days. No credit card. No required calls."
              : "30 days. No credit card. Cancel anytime."}
          </p>

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

          {isFoundingUser && (
            <div className="mt-5 bg-white border border-stone-200 rounded-md px-4 py-3 text-[13px] text-stone-600 leading-relaxed" data-testid="signup-optional-walkthrough">
              <p className="font-semibold text-[#1F2937] mb-1">Want a guided setup?</p>
              <p>
                After you create your account, you can optionally book a 30-minute
                walkthrough with Jeff — the person building Steno Desk. No sales
                pitch, no obligation. Just skip it if you'd rather jump in on your own.
              </p>
            </div>
          )}

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