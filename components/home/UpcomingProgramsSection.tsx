import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { formatProgramPrice, formatProgramSchedule, getUpcomingPrograms, programCategoryImages, programStatusLabels } from "@/lib/public-content";

import { ContentImage } from "./ContentImage";

export async function UpcomingProgramsSection() {
  const { items, isSample } = await getUpcomingPrograms(3);

  return (
    <section aria-labelledby="program-title" className="border-y border-[#E8E2D5] bg-[#F1EDE2]">
      <div className="mx-auto max-w-7xl px-4 py-15 sm:px-6 sm:py-20 lg:px-8">
        <h2 id="program-title" className="text-center text-3xl tracking-tight sm:text-4xl">
          Program Mendatang
        </h2>
        <ProgramCards items={items} isSample={isSample} />
      </div>
    </section>
  );
}

export function ProgramCards({ items, isSample, showCatalogDetails = false }:
  Awaited<ReturnType<typeof getUpcomingPrograms>> & { showCatalogDetails?: boolean }) {
  return (
    <>
    {isSample && (
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Contoh program PLA. Jadwal resmi menyusul.
      </p>
    )}
    {items.length === 0 && <p className="mt-8 text-center text-muted-foreground">Tidak ada program yang cocok dengan filter.</p>}
    <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((program) => (
        <article key={program.slug} className="min-w-0">
          <Link
            href={`/program/${encodeURIComponent(program.slug)}`}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8E2D5] bg-card shadow-[0_5px_18px_rgba(7,63,50,0.045)] transition-colors hover:border-accent/75"
          >
            <ContentImage src={program.poster_url} fallback={programCategoryImages[program.category]} />
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-[#F1EDE2] px-3 py-1.5 text-primary">{program.category}</span>
                <span className="rounded-full bg-accent/25 px-3 py-1.5 text-primary">{formatProgramPrice(program)}</span>
                {showCatalogDetails && <span className="text-muted-foreground">{program.mode}</span>}
                {program.status && (showCatalogDetails || program.status === "FULL") && (
                  <span className="text-muted-foreground">{programStatusLabels[program.status]}</span>
                )}
              </div>
              <h3 className="mt-3 text-2xl leading-tight tracking-tight">{program.title}</h3>
              <p className="mt-2 mb-5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{program.description}</p>
              <p className="mt-auto flex items-center gap-2 border-t border-[#E8E2D5] pt-4 text-sm font-medium text-primary">
                <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-[#806126]" />
                {program.schedule_date ? (
                  <time dateTime={program.schedule_date}>{formatProgramSchedule(program.schedule_date)}</time>
                ) : formatProgramSchedule(null)}
              </p>
            </div>
          </Link>
        </article>
      ))}
    </div>
    </>
  );
}
