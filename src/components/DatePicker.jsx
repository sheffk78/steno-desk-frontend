import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** A shadcn-styled date picker that round-trips an ISO yyyy-mm-dd string.
 *
 *  Props:
 *    value:        "yyyy-mm-dd" | "" — controlled value (string for parity with <input type="date">)
 *    onChange(v):  receives "yyyy-mm-dd" or "" (when cleared)
 *    placeholder:  fallback label when value is empty
 *    clearable:    show a small × to clear the value (default true)
 *    className:    extra classes for the trigger button
 *    "data-testid": forwarded to the trigger button
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  clearable = true,
  className,
  ...rest
}) {
  // Parse the ISO string into a Date (interpreted as local midnight) — never UTC,
  // so the calendar selection matches what the user types in the field.
  const parsed = (() => {
    if (!value) return undefined;
    const d = parseISO(value);
    return isValid(d) ? d : undefined;
  })();

  const display = parsed ? format(parsed, "MMM d, yyyy") : "";

  const handleSelect = (d) => {
    if (!d) {
      onChange("");
      return;
    }
    // Local-time YYYY-MM-DD (avoid the off-by-one introduced by toISOString in non-UTC zones)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          {...rest}
          className={cn(
            "h-9 w-full justify-start font-normal border-[#E5E1DA] bg-white hover:bg-[#F3F0E9] tabular",
            !display && "text-[#9CA3AF]",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-2 text-[#6B7280]" />
          {display || placeholder}
          {clearable && display && (
            <span
              role="button"
              aria-label="Clear date"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }}
              className="ml-auto p-0.5 rounded hover:bg-[#E5E1DA] text-[#6B7280]"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
