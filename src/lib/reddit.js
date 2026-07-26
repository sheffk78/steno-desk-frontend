/**
 * Thin wrapper around the Reddit Pixel `rdt()` global.
 *
 * Why a helper:
 *  - Centralizes the `typeof window.rdt === "function"` guard so an
 *    ad-blocker (or the pixel still loading) never throws.
 *  - Lets us add server-side Reddit Conversions API later without
 *    touching every call site.
 *  - Single place to add a console.debug in dev so we can verify events
 *    are firing without hopping between files.
 *
 * Usage:
 *   import { redditTrack } from "@/lib/reddit";
 *   redditTrack("Purchase", { value: 39, currency: "USD", transactionId: "sub_xxx" });
 */
export function redditTrack(event, params = {}) {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.rdt !== "function") return;
    window.rdt("track", event, params);
    if (process.env.NODE_ENV !== "production") {
      console.debug("[rdt]", event, params);
    }
  } catch {
    // Never let analytics break a user flow.
  }
}
