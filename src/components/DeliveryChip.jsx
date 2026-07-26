/**
 * DeliveryChip — shows Postmark delivery/open/bounce state next to an
 * invoice's main Status pill. Returns null when the invoice hasn't been
 * sent (Draft / Void) or when Postmark hasn't reported anything yet.
 *
 * Priority: Bounce > Opened > Delivered.
 */
import { CheckCheck, MailWarning, Eye } from "lucide-react";

const relTime = (iso) => {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "";
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function DeliveryChip({ invoice, compact = false }) {
  if (!invoice) return null;
  if (invoice.status === "Draft" || invoice.status === "Void") return null;

  // Bounce takes precedence over everything else.
  if (invoice.bounce_status) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded"
        title={invoice.bounce_message || invoice.bounce_status}
        data-testid="delivery-chip-bounce"
      >
        <MailWarning className="h-3 w-3" /> Bounced
      </span>
    );
  }

  if (invoice.opened_at) {
    const label = relTime(invoice.last_opened_at || invoice.opened_at);
    const opens = invoice.opens_count || 1;
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
        title={`Opened ${opens} time${opens === 1 ? "" : "s"} · last ${label}`}
        data-testid="delivery-chip-opened"
      >
        <Eye className="h-3 w-3" /> Opened {compact ? "" : label}
      </span>
    );
  }

  if (invoice.delivered_at) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] text-stone-700 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded"
        title={`Delivered ${relTime(invoice.delivered_at)}`}
        data-testid="delivery-chip-delivered"
      >
        <CheckCheck className="h-3 w-3" /> Delivered
      </span>
    );
  }

  return null;
}
