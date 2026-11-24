"use client";

import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";

export function ArticleShare({ title, path, canonical }: { title: string; path: string; canonical?: string }) {
  const [notice, setNotice] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const getUrl = () => canonical ?? new URL(path, window.location.origin).href;

  async function copyLink() {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setManualUrl("");
      setNotice("Tautan disalin.");
    } catch {
      setManualUrl(url);
      setNotice("Salin tautan dari kolom di bawah.");
    }
  }

  return (
    <div className="mt-7">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${getUrl()}`)}`, "_blank", "noopener,noreferrer")}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          <MessageCircle aria-hidden="true" className="size-4" /> Bagikan via WhatsApp
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-accent px-4 text-sm font-bold text-primary"
        >
          <Copy aria-hidden="true" className="size-4" /> Salin tautan
        </button>
      </div>
      {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      {manualUrl && (
        <input
          aria-label="Tautan artikel"
          readOnly
          value={manualUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-2 min-h-11 w-full rounded-md border bg-card px-3 text-sm"
        />
      )}
    </div>
  );
}
