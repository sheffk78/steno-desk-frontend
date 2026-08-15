import { useState } from "react";
import { Mail, X } from "lucide-react";

/**
 * FloatingContact — floating "Contact" button bottom-right that expands
 * into a small popover with email + support link. Hidden on print.
 */
export default function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[55] print:hidden" data-testid="floating-contact">
      {open && (
        <div className="absolute bottom-16 right-0 w-72 bg-white border border-[#E5E1DA] rounded-lg shadow-xl p-5 sd-fade">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-[#1F2937] text-[15px]">Get in touch</span>
            <button
              onClick={() => setOpen(false)}
              className="text-[#6B7280] hover:text-[#1F2937]"
              aria-label="Close contact"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-[#6B7280] mb-4">
            Questions about Steno Desk? Reach Jeff directly — no support queue.
          </p>
          <a
            href="mailto:jeff@stenodesk.co"
            className="flex items-center gap-2 text-sm text-[#1F2937] hover:text-[#111827] font-medium"
          >
            <Mail className="h-4 w-4" /> jeff@stenodesk.co
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#1F2937] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#111827] transition-colors"
        aria-label="Contact us"
        data-testid="floating-contact-btn"
      >
        <Mail className="h-5 w-5" />
        <span className="text-sm font-medium">{open ? "Close" : "Contact"}</span>
      </button>
    </div>
  );
}