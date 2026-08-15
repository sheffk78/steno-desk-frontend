import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * SiteSearch — lightweight in-page search for the landing page.
 * Searches section headings + FAQ. Opens a dropdown with clickable results.
 * Not a full site search — covers the marketing page content.
 */
const SEARCHABLE = [
  { label: "Features", href: "#features", text: "Built-in court reporter line items, per-client rate memory, send from inside the app, tax-time CSV export" },
  { label: "Pricing", href: "#pricing", text: "Simple pricing, monthly $39, annual $249, no surprises" },
  { label: "Founding User Program", href: "#founding", text: "Be among the first, 60 days free, direct line to Jeff" },
  { label: "FAQ — Agencies or freelancers?", href: "#faq", text: "Freelancers only, not agencies" },
  { label: "FAQ — After trial?", href: "#faq", text: "Nothing automatically, account stays open" },
  { label: "FAQ — Transcript files?", href: "#faq", text: "No, handles business side only, not CAT files" },
  { label: "FAQ — Export data?", href: "#faq", text: "Yes, PDFs and CSV export" },
  { label: "FAQ — Existing software?", href: "#faq", text: "Run alongside during trial" },
  { label: "FAQ — Call required?", href: "#faq", text: "No, self-serve trial, optional walkthrough" },
  { label: "How it works", href: "#how-it-works", text: "Add job, build invoice, send and track" },
  { label: "Sign in", href: "/login", text: "Sign in to Steno Desk" },
  { label: "Start free trial", href: "/signup", text: "Create account, 7 day trial" },
];

export default function SiteSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const filtered = SEARCHABLE.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.text.toLowerCase().includes(q)
    );
    setResults(filtered);
    setOpen(true);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleResultClick = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative" data-testid="site-search">
      <div className="flex items-center gap-1.5 text-[#6B7280]">
        <Search className="h-4 w-4 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search…"
          className="bg-transparent text-[14px] text-[#1F2937] placeholder:text-[#9CA3AF] outline-none w-20 focus:w-32 transition-all duration-200 dark:text-gray-200 dark:placeholder:text-gray-500"
          aria-label="Search site"
          data-testid="site-search-input"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-[#E5E1DA] rounded-lg shadow-xl overflow-hidden z-50 dark:bg-gray-800 dark:border-gray-700">
          {results.map((r, i) => (
            <Link
              key={i}
              to={r.href}
              onClick={handleResultClick}
              className="block px-4 py-3 hover:bg-[#F3F0E9] dark:hover:bg-gray-700 border-b border-[#E5E1DA] last:border-0 dark:border-gray-700"
            >
              <div className="text-sm font-medium text-[#1F2937] dark:text-gray-200">{r.label}</div>
              <div className="text-xs text-[#6B7280] dark:text-gray-400 truncate">{r.text}</div>
            </Link>
          ))}
        </div>
      )}
      {open && results.length === 0 && query && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-[#E5E1DA] rounded-lg shadow-xl px-4 py-3 z-50 dark:bg-gray-800 dark:border-gray-700">
          <span className="text-sm text-[#6B7280] dark:text-gray-400">No results for "{query}"</span>
        </div>
      )}
    </div>
  );
}