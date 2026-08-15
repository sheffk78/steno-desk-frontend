/**
 * utm.js — capture UTM parameters from the URL and persist to sessionStorage.
 * On signup, these are sent to the backend with the lead/registration.
 *
 * Usage:
 *   import { captureUTM, getUTM } from "@/lib/utm";
 *   captureUTM();  // call once on app load
 *   const utm = getUTM();  // { utm_source, utm_medium, utm_campaign, ... }
 */

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const STORAGE_KEY = "sd_utm_params";

export function captureUTM() {
  try {
    const params = new URLSearchParams(window.location.search);
    const captured = {};
    let found = false;
    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) {
        captured[key] = val;
        found = true;
      }
    }
    if (found) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
    }
  } catch {
    // sessionStorage may be blocked
  }
}

export function getUTM() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}