import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Global 402 handler — surfaces a clear "trial ended" toast with an
// Upgrade button, then routes the user to Settings → Subscription. The
// banner at the top of the page also makes the state obvious, so this
// interceptor exists mostly to catch race conditions where someone
// clicks Save right as their trial ends.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 402) {
      const d = err.response.data?.detail;
      const msg = typeof d === "string"
        ? d
        : d?.message || "Your trial has ended. Upgrade to keep working.";
      toast.error(msg, {
        action: {
          label: "Upgrade",
          onClick: () => { window.location.href = "/app/settings?tab=subscription"; },
        },
        duration: 8000,
      });
    }
    return Promise.reject(err);
  }
);

// Format FastAPI errors safely (422 returns array of {msg,...})
export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  // 402 returns {code, message, reason}
  if (detail && typeof detail.message === "string") return detail.message;
  return String(detail);
}

export function errMessage(e, fallback = "Something went wrong.") {
  return formatApiError(e?.response?.data?.detail) || e?.message || fallback;
}
