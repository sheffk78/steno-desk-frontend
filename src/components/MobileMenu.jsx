import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * MobileMenu — hamburger toggle for mobile viewport (< md).
 * Uses a Sheet-style slide-down panel. Shows nav links + auth buttons.
 */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#founding", label: "Founding Users" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="md:hidden" data-testid="mobile-menu">
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-[#1F2937] rounded-md hover:bg-[#F3F0E9] dark:text-gray-200 dark:hover:bg-gray-800"
        aria-label="Open menu"
        data-testid="mobile-menu-toggle"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            className="fixed top-0 left-0 right-0 z-50 bg-[#FBFAF7] dark:bg-gray-900 border-b border-[#E5E1DA] dark:border-gray-700 shadow-lg sd-fade"
            data-testid="mobile-menu-panel"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1DA] dark:border-gray-700">
              <span className="text-[15px] font-semibold text-[#1F2937] dark:text-gray-200">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-[#6B7280] hover:text-[#1F2937] dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-[16px] text-[#1F2937] hover:text-[#111827] dark:text-gray-200 dark:hover:text-white border-b border-[#E5E1DA]/50 dark:border-gray-700/50"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-center text-[15px] text-[#1F2937] py-2.5 border border-[#E5E1DA] dark:text-gray-200 dark:border-gray-600 rounded-md"
                >
                  Sign in
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-[#1F2937] hover:bg-[#111827] text-white text-[15px] h-10 rounded-md">
                    Start free trial
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}