import { useState, useEffect } from "react";

const STORAGE_KEY = "sd-cookie-consent";

/**
 * CookieBanner — dismissible GDPR/cookie consent banner.
 * Persists consent to localStorage. Uses Radix-style overlay semantics.
 * Shows only once per visitor (until they clear localStorage).
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage may be blocked — skip banner
    }
  }, []);

  const handleConsent = (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] bg-[#1F2937] text-white px-6 py-4 shadow-lg"
      role="region"
      aria-label="Cookie consent"
      data-testid="cookie-banner"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-200">
          We use cookies to keep you signed in and understand how the app is used.{" "}
          <a href="/privacy" className="underline hover:text-white">Learn more</a>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleConsent("declined")}
            className="text-sm text-gray-300 hover:text-white px-3 py-1.5"
            data-testid="cookie-decline"
          >
            Decline
          </button>
          <button
            onClick={() => handleConsent("accepted")}
            className="text-sm bg-white text-[#1F2937] font-medium px-4 py-1.5 rounded-md hover:bg-gray-100"
            data-testid="cookie-accept"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}