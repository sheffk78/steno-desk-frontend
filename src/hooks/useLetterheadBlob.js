import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Fetch a private user file (letterhead, signature, etc.) as a blob and
 *  return a render-ready object URL. Auth is the cookie via withCredentials.
 *
 *  Usage:
 *    const { blobUrl } = useLetterheadBlob(user?.letterhead_url, user?.letterhead_uploaded_at);
 *    {blobUrl && <img src={blobUrl} alt="Letterhead" />}
 *
 *  - Re-fetches when `url` or `uploadedAt` changes (so Replace flow remounts).
 *  - Revokes the previous blob URL on unmount / re-fetch (no leaks).
 *  - Returns `{ blobUrl: null }` while loading or on error — callers should
 *    silently fall back to text branding.
 */
export default function useLetterheadBlob(url, uploadedAt) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let created = null;

    async function load() {
      if (!url) {
        setBlobUrl(null);
        return;
      }
      try {
        // axios baseURL already ends in /api, so strip the leading /api here.
        const res = await api.get(url.replace(/^\/api/, ""), { responseType: "blob" });
        if (cancelled) return;
        created = URL.createObjectURL(res.data);
        setBlobUrl(created);
      } catch {
        if (!cancelled) setBlobUrl(null);
      }
    }
    load();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [url, uploadedAt]);

  return { blobUrl };
}
