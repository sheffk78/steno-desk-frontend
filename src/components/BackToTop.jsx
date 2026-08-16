import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

/**
 * BackToTop — floating button bottom-right that scrolls to top.
 * Appears after scrolling ~500px. Hidden on print.
 * Positioned at right-24 to avoid overlapping FloatingContact (right-6).
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-24 z-[55] print:hidden flex items-center justify-center bg-[#1F2937] text-white w-12 h-12 rounded-full shadow-lg hover:bg-[#111827] transition-colors"
      aria-label="Back to top"
      data-testid="back-to-top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}