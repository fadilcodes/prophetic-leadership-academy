"use client";

import { Download } from "lucide-react";
import { useState } from "react";

const imageExtensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export function QrisDownload({ imageUrl }: { imageUrl: string | null }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    if (!imageUrl || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(imageUrl, {
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error("Gambar tidak tersedia");
      const blob = await response.blob();
      const extension = imageExtensions[blob.type];
      if (!extension || !blob.size) throw new Error("Format gambar tidak didukung");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QRIS-PLA.${extension}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={download}
        disabled={!imageUrl || busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-accent px-4 text-sm font-bold text-primary hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <Download aria-hidden="true" className="size-4" />
        {busy ? "Mengunduh…" : "Download Gambar QRIS"}
      </button>
      {failed && imageUrl && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Unduhan langsung belum tersedia.{" "}
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">Buka gambar QRIS</a>{" "}
          untuk menyimpannya.
        </p>
      )}
    </div>
  );
}
