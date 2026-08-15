import { useState, useEffect } from "react";

/**
 * ScrollProgress — thin gold bar at top of page showing scroll position.
 * Fixed at z-50, updates on scroll. Hidden on short pages / print.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min((scrollTop / docHeight) * 100, 100));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] h-1 bg-transparent pointer-events-none"
      aria-hidden="true"
      data-testid="scroll-progress"
    >
      <div
        className="h-full bg-[#D4A056] transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}