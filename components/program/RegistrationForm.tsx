"use client";

import { useRef, useState, type FormEvent } from "react";

const fields = [
  { name: "name", label: "Nama Lengkap", type: "text", autoComplete: "name", maxLength: 100, required: true },
  { name: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 254, required: true },
  { name: "phone", label: "No. WhatsApp", type: "tel", autoComplete: "tel", maxLength: 25, required: true },
  { name: "institution", label: "Asal Sekolah/Instansi (opsional)", type: "text", autoComplete: "organization", maxLength: 150, required: false },
] as const;

export function RegistrationForm({ slug, isPaid, registrationId }: {
  slug: string; isPaid: boolean; registrationId: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const requestActive = useRef(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestActive.current) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    requestActive.current = true;
    setSubmitting(true);

    try {
      const response = await fetch("/api/programs/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, slug, registration_id: registrationId }),
      });
      const data = await response.json();
      if (response.ok && typeof data.redirect_url === "string") {
        window.location.assign(data.redirect_url);
        return;
      }
      setError(data.error ?? "Pendaftaran belum dapat diproses. Silakan coba lagi.");
    } catch {
      setError("Pendaftaran belum dapat diproses. Silakan coba lagi.");
    }
    requestActive.current = false;
    setSubmitting(false);
  }

  return (
    <form method="post" action="/api/programs/register" onSubmit={submit} className="mt-5 grid gap-4">
      {fields.map((field) => (
        <label key={field.name} className="grid gap-2 text-sm font-bold text-primary">
          {field.label}
          <input
            name={field.name} type={field.type} autoComplete={field.autoComplete}
            maxLength={field.maxLength} required={field.required} readOnly={submitting}
            className="min-h-11 w-full rounded-lg border border-input bg-card px-3 font-normal text-foreground"
          />
        </label>
      ))}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={submitting} aria-busy={submitting || undefined}
        className="min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground enabled:hover:bg-accent-hover">
        {submitting ? "Sedang memproses…" : isPaid ? "Lanjut ke pembayaran" : "Konfirmasi pendaftaran"}
      </button>
    </form>
  );
}
