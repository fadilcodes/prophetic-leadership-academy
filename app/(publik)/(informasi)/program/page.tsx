import type { Metadata } from "next";
import Link from "next/link";

import { ProgramCards } from "@/components/home/UpcomingProgramsSection";
import { getProgramCatalog, programStatusLabels } from "@/lib/public-content";

export const metadata: Metadata = { title: "Program" };

const categories = ["Pelatihan", "Kajian", "Pendampingan"] as const;
const modes = ["Online", "Offline"] as const;
const statuses = ["OPEN", "FULL", "COMPLETED"] as const;

export default async function ProgramsPage({ searchParams }: PageProps<"/program">) {
  const params = await searchParams;
  const category = categories.find((value) => value === params.kategori);
  const mode = modes.find((value) => value === params.mode);
  const status = statuses.find((value) => value === params.status);
  const programs = await getProgramCatalog({ category, mode, status });
  const selectClass = "min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground";

  return (
    <>
      <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">Katalog Program</h1>
      <form action="/program" method="get" aria-label="Filter program"
        className="mt-8 grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-3 sm:p-6 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <label className="grid gap-2 text-sm font-bold text-primary">
          Kategori
          <select name="kategori" defaultValue={category ?? ""} className={selectClass}>
            <option value="">Semua</option>
            {categories.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-primary">
          Mode
          <select name="mode" defaultValue={mode ?? ""} className={selectClass}>
            <option value="">Semua</option>
            {modes.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-primary">
          Status
          <select name="status" defaultValue={status ?? ""} className={selectClass}>
            <option value="">Semua</option>
            {statuses.map((value) => <option key={value} value={value}>{programStatusLabels[value]}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3 lg:col-span-1">
          <button type="submit" className="min-h-11 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground">
            Terapkan filter
          </button>
          {(category || mode || status) && (
            <Link href="/program" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-primary underline">
              Reset
            </Link>
          )}
        </div>
      </form>
      <ProgramCards {...programs} showCatalogDetails />
    </>
  );
}
