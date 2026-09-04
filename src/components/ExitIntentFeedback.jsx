import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { getUTM } from "@/lib/utm";

const STORAGE_KEY = "sd-exit-feedback-seen";
const MIN_TIME_MS = 8000; // don't trigger before visitor has been on page 8s
const EXIT_THRESHOLD = 20; // px from top where mouse-leave triggers (desktop)

/**
 * ExitIntentFeedback — lightweight exit-intent popup that asks visitors
 * what feature they feel is missing before they leave.
 *
 * Trigger logic:
 *  - Desktop: mouse leaves the top of the viewport (toward address bar / back button)
 *  - Mobile: no mouse-leave; uses a 45s inactivity timer + scroll-up-to-top
 *  - Only shows once per visitor (localStorage flag)
 *  - Only on landing page (not inside the authenticated app)
 *  - Won't fire if visitor has been on page < 8s (avoids accidental triggers)
 *
 * Posts to /api/feedback (public, no auth). Sends feature text + optional email.
 */
export default function ExitIntentFeedback() {
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [feature, setFeature] = useState("");
  const [email, setEmail] = useState("");
  const pageLoadRef = useRef(Date.now());
  const mobileTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // --- Dismiss & persist ---------------------------------------------------
  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage blocked — popup just won't persist dismissal
    }
  }, []);

  // --- Submit ---------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feature.trim()) return;
    setSending(true);
    try {
      await api.post("/feedback", {
        feature: feature.trim(),
        email: email.trim() || undefined,
        page_url: window.location.href,
        source: getUTM().utm_source || "exit_intent",
      });
      setSubmitted(true);
      // Auto-dismiss after showing thank-you state for 3s
      setTimeout(() => dismiss(), 3000);
    } catch {
      // Silently fail — never show error to a leaving visitor
      dismiss();
    } finally {
      setSending(false);
    }
  };

  // --- Exit-intent detection (desktop) -------------------------------------
  useEffect(() => {
    // Only run on landing page (path "/")
    if (window.location.pathname !== "/") return;

    // Check if already shown
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage blocked — proceed without persistence
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const handleMouseOut = (e) => {
      // Only trigger when mouse leaves through the TOP of the viewport
      // (toward address bar / back button / tabs) — not sides or bottom
      if (e.clientY <= EXIT_THRESHOLD && !e.relatedTarget && !e.toElement) {
        const elapsed = Date.now() - pageLoadRef.current;
        if (elapsed >= MIN_TIME_MS) {
          setVisible(true);
          document.removeEventListener("mouseout", handleMouseOut);
        }
      }
    };

    // Mobile fallback: 45s of inactivity + scroll to top
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleScroll = () => {
      handleActivity();
      // If user scrolls back to top after scrolling down, that's a signal
      if (window.scrollY < 50 && window.history.length > 1) {
        const elapsed = Date.now() - pageLoadRef.current;
        const inactive = Date.now() - lastActivityRef.current;
        if (elapsed >= MIN_TIME_MS && inactive > 5000) {
          // Only trigger on scroll-to-top, not initial load
          if (document.body.scrollHeight > window.innerHeight * 2) {
            setVisible(true);
            window.removeEventListener("scroll", handleScroll);
            if (mobileTimerRef.current) clearInterval(mobileTimerRef.current);
          }
        }
      }
    };

    if (isMobile) {
      const checkInactivity = () => {
        const inactive = Date.now() - lastActivityRef.current;
        const elapsed = Date.now() - pageLoadRef.current;
        if (elapsed >= 45000 && inactive > 20000) {
          setVisible(true);
          if (mobileTimerRef.current) clearInterval(mobileTimerRef.current);
          window.removeEventListener("scroll", handleScroll);
        }
      };
      mobileTimerRef.current = setInterval(checkInactivity, 5000);
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        if (mobileTimerRef.current) clearInterval(mobileTimerRef.current);
        window.removeEventListener("scroll", handleScroll);
      };
    } else {
      document.addEventListener("mouseout", handleMouseOut);
      return () => document.removeEventListener("mouseout", handleMouseOut);
    }
  }, []);

  // --- Escape to close ------------------------------------------------------
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 sd-fade"
      role="dialog"
      aria-modal="true"
      aria-label="Feature feedback"
      data-testid="exit-feedback-overlay"
      onClick={dismiss}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 sm:p-8 relative"
        data-testid="exit-feedback-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] transition-colors"
          aria-label="Close feedback"
          data-testid="exit-feedback-close"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          /* --- Thank-you state --- */
          <div className="text-center py-6" data-testid="exit-feedback-thanks">
            <CheckCircle2 className="h-12 w-12 text-[#166534] mx-auto mb-4" />
            <h2 className="font-heading text-2xl text-[#1C1917] mb-2">
              Thank you.
            </h2>
            <p className="text-sm text-[#44403C]">
              Your feedback helps us build exactly what court reporters need.
              {email && " We'll let you know when it's ready."}
            </p>
          </div>
        ) : (
          /* --- Form state --- */
          <>
            <h2
              className="font-heading text-2xl text-[#1C1917] mb-2 pr-8"
              data-testid="exit-feedback-title"
            >
              Before you go —
            </h2>
            <p className="text-sm text-[#44403C] mb-5">
              What's the one feature that would make Steno Desk a no-brainer for
              you?
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                placeholder="e.g. I need a way to track page rates per agency…"
                rows={3}
                maxLength={2000}
                autoFocus
                required
                className="w-full border border-[#E7E5E4] rounded-md px-3 py-2 text-sm text-[#1C1917] bg-white focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-colors resize-none"
                data-testid="exit-feedback-text"
              />

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional — want us to let you know when we build it?)"
                  className="w-full border border-[#E7E5E4] rounded-md px-3 py-2 text-sm text-[#1C1917] bg-white focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] transition-colors"
                  data-testid="exit-feedback-email"
                />
              </div>

              <button
                type="submit"
                disabled={sending || !feature.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#1E293B] text-white rounded-md px-4 py-2.5 text-sm font-medium hover:bg-[#0F172A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="exit-feedback-submit"
              >
                {sending ? (
                  "Sending…"
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send feedback
                  </>
                )}
              </button>

              <p className="text-xs text-[#78716C] text-center">
                No spam, no follow-up unless you asked for it.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}