"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function TrackingDialog({ id, number, trackingNumber, notified }: {
  id: string; number: string; trackingNumber: string | null; notified: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [savedWithWarning, setSavedWithWarning] = useState(false);
  const [tracking, setTracking] = useState(trackingNumber ?? "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}/resi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: tracking }),
      });
      const data = await response.json();
      if (response.ok && data.notified) {
        setSavedWithWarning(false);
        setOpen(false);
        router.refresh();
      } else {
        if (data.saved) setSavedWithWarning(true);
        setMessage(data.error || "Resi belum dapat disimpan.");
      }
    } catch {
      setMessage("Resi belum dapat disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(value) => {
      if (saving) return;
      setMessage("");
      if (value) setTracking(trackingNumber ?? "");
      else if (savedWithWarning) {
        setSavedWithWarning(false);
        router.refresh();
      }
      setOpen(value);
    }}>
      <Dialog.Trigger className="inline-flex min-h-11 items-center rounded-lg border bg-card px-3 text-sm font-bold text-primary hover:bg-secondary">
        {trackingNumber ? notified ? "Ubah resi" : "Kirim ulang notifikasi" : "Masukkan resi"}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-primary/55" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-5 shadow-lg sm:p-6"
          onOpenAutoFocus={(event) => {
            const field = event.currentTarget instanceof HTMLElement && event.currentTarget.querySelector("input");
            if (field) {
              event.preventDefault();
              field.focus();
            }
          }}>
          <Dialog.Title className="pr-10 text-xl font-bold text-primary">Nomor Resi Pengiriman</Dialog.Title>
          <Dialog.Description className="mt-2 break-all text-sm text-muted-foreground">Pesanan {number}</Dialog.Description>
          <Dialog.Close aria-label="Tutup" disabled={saving} className="absolute right-3 top-3 grid size-11 place-items-center rounded-md text-primary hover:bg-secondary">
            <X size={18} aria-hidden="true" />
          </Dialog.Close>
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-primary">Nomor resi
              <input name="tracking_number" value={tracking} onChange={(event) => setTracking(event.target.value)}
                required maxLength={80} readOnly={saving} className="min-h-11 rounded-lg border border-input px-3 font-normal" />
            </label>
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <button disabled={saving} className="min-h-11 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">
              {saving ? "Memproses…" : "Simpan dan kirim email"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
