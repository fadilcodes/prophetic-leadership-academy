import { SubmitButton } from "@/components/ui/SubmitButton";

import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminQuery } from "@/lib/admin/forms";

export const inputClass = "min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal text-foreground";
export const primaryButton = "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:not-disabled:bg-primary-hover";
export const secondaryButton = "inline-flex min-h-11 items-center justify-center rounded-lg border bg-card px-3 text-sm font-bold text-primary hover:not-disabled:bg-secondary";
export const labelClass = "grid gap-1.5 text-sm font-bold text-primary";
export const tableRow = "border-t align-top [&_td]:px-4 [&_td]:py-3";

type FieldProps = {
  name: string; label: string; value?: string | number | null; required?: boolean;
  type?: string; min?: number; maxLength?: number; area?: boolean; rows?: number;
};

export function Field({ name, label, value, required, type = "text", min, maxLength, area, rows = 4 }: FieldProps) {
  return (
    <label className={labelClass}>{label}
      {area ? <textarea name={name} className={inputClass} defaultValue={value ?? ""} required={required} rows={rows} maxLength={maxLength} />
        : <input name={name} className={inputClass} defaultValue={value ?? ""} required={required} type={type} min={min} maxLength={maxLength} />}
    </label>
  );
}

export function SelectField({ name, label, value, options, required }: {
  name: string; label: string; value?: string | null; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <label className={labelClass}>{label}
      <select name={name} className={inputClass} defaultValue={value ?? ""} required={required}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function Checkbox({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-primary">
    <input name={name} type="checkbox" defaultChecked={checked} className="size-5 accent-primary" /> {label}
  </label>;
}

export function Editor({ title, action, id, base, children }: {
  title: string; action: (form: FormData) => void | Promise<void>; id?: string; base: string; children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="mb-4 text-2xl">{title}</h2>
      <form action={action} className="grid gap-4">
        {id && <input type="hidden" name="id" value={id} />}
        {children}
        <div className="flex flex-wrap gap-2">
          <SubmitButton className={primaryButton}>Simpan</SubmitButton>
          {id && <Link href={base} className={secondaryButton}>Batal</Link>}
        </div>
      </form>
    </section>
  );
}

const messages: Record<string, string> = {
  invalid: "Periksa isi formulir dan lengkapi kolom wajib.",
  duplicate: "Slug atau data unik sudah dipakai.",
  relation: "Data masih terhubung dengan catatan lain.",
  constraint: "Nilai baru bertentangan dengan data atau reservasi yang tercatat.",
  missing: "Data sudah berubah atau tidak ditemukan. Muat ulang dan coba lagi.",
  database: "Perubahan belum dapat disimpan.",
  image: "Pilih gambar PNG, JPG, atau WebP yang valid dengan ukuran maksimal 2 MB.",
  storage: "Gambar belum dapat diunggah.",
};

export function Notice({ params }: { params: AdminQuery }) {
  const issue = typeof params.error === "string" && Object.hasOwn(messages, params.error) ? messages[params.error] : null;
  if (issue) return <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-card p-3 text-sm text-destructive">{issue}</p>;
  if (params.saved === "1") return <p role="status" className="mt-4 rounded-lg border bg-secondary p-3 text-sm text-primary">Perubahan tersimpan.</p>;
  return null;
}

export function AdminTable({ columns, children, empty = false }: { columns: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div tabIndex={0} role="region" aria-label={columns.join(", ")} className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary text-primary"><tr>{columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-4 py-3">{column}</th>)}</tr></thead>
        <tbody>
          {children}
          {empty && <tr><td colSpan={columns.length} className="px-4 py-6 text-muted-foreground">Belum ada data.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ path, page, count, filters }: { path: string; page: number; count: number; filters?: Record<string, string> }) {
  const total = Math.max(1, Math.ceil(count / 30));
  if (total <= 1 && page === 1) return null;
  const href = (target: number) => `${path}?${new URLSearchParams({ ...filters, page: String(target) })}`;
  return <nav aria-label="Halaman data" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-primary">
    {page > 1 && <Link href={href(page - 1)} className={secondaryButton}>Sebelumnya</Link>}
    <span>Halaman {page} dari {total}</span>
    {page < total && <Link href={href(page + 1)} className={secondaryButton}>Berikutnya</Link>}
  </nav>;
}
