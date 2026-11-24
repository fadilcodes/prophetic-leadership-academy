import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";

import { RegistrationForm } from "@/components/program/RegistrationForm";
import {
  formatProgramPrice, formatProgramSchedule, getPublicProgram, programCategoryImages, programStatusLabels,
} from "@/lib/public-content";
import { getPublicImageUrl } from "@/lib/public-url";

export default async function ProgramPage({ params }: PageProps<"/program/[slug]">) {
  const { slug } = await params;
  const result = await getPublicProgram(slug);
  if (!result) notFound();

  const { program, detail } = result;
  const remaining = detail ? Math.max(0, detail.quota - detail.registered_count) : null;
  const canRegister = detail?.status === "OPEN" && remaining !== null && remaining > 0
    && Date.parse(detail.schedule_date) > Date.now();
  const syllabus = Array.isArray(detail?.syllabus)
    ? detail.syllabus.filter((topic): topic is string => typeof topic === "string" && topic.trim().length > 0)
    : [];
  const speaker = detail?.ustadz_profiles;
  const speakerPhoto = getPublicImageUrl(speaker?.photo_url);
  const poster = getPublicImageUrl(program.poster_url);
  const image = poster ?? programCategoryImages[program.category];
  const price = formatProgramPrice(program);
  const location = program.location_or_platform;

  return (
    <article className={canRegister ? "pb-14 lg:pb-0" : undefined}>
      <Link href="/program" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" /> Semua program
      </Link>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">{program.category} · {program.mode}</p>
          <h1 className="mt-2 text-4xl leading-tight tracking-tight sm:text-5xl">{program.title}</h1>

          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-secondary sm:aspect-video">
            <Image src={image} alt={poster ? `Poster ${program.title}` : ""} fill unoptimized={!image.startsWith("/")}
              sizes="(max-width: 1023px) 100vw, 760px" className={poster ? "object-contain" : "object-cover"} />
          </div>

          <dl className="mt-6 grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-2 text-sm font-bold text-primary">
                <CalendarDays aria-hidden="true" className="size-4" /> Jadwal
              </dt>
              <dd className="mt-2 text-sm text-muted-foreground">
                {program.schedule_date ? (
                  <time dateTime={program.schedule_date}>{formatProgramSchedule(program.schedule_date)}</time>
                ) : formatProgramSchedule(null)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm font-bold text-primary">
                <MapPin aria-hidden="true" className="size-4" /> {program.mode === "Online" ? "Platform" : "Lokasi"}
              </dt>
              <dd className="mt-2 break-words text-sm text-muted-foreground">{location}</dd>
            </div>
            {remaining !== null && (
              <div>
                <dt className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Users aria-hidden="true" className="size-4" /> Sisa kuota
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground">{remaining} tempat</dd>
              </div>
            )}
          </dl>

          <section className="mt-8">
            <h2 className="text-2xl">Tentang program</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{program.description}</p>
          </section>
          {syllabus.length > 0 && (
            <section className="mt-8">
              <h2 className="text-2xl">Silabus materi</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-6 leading-relaxed marker:font-bold marker:text-primary">
                {syllabus.map((topic, index) => <li key={index}>{topic}</li>)}
              </ol>
            </section>
          )}
          {speaker && (
            <section className="mt-8">
              <h2 className="text-2xl">Ustadz pemateri</h2>
              <div className="mt-3 flex items-start gap-4 rounded-2xl border bg-card p-5">
                {speakerPhoto && (
                  <Image src={speakerPhoto} alt="" width={64} height={64} unoptimized={!speakerPhoto.startsWith("/")}
                    className="size-16 shrink-0 rounded-full object-cover" />
                )}
                <div className="min-w-0">
                  <h3 className="text-xl">{speaker.name}</h3>
                  <p className="mt-1 text-sm font-bold text-primary">{speaker.title}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{speaker.bio}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        <section id="pendaftaran" aria-labelledby="registration-heading"
          className="scroll-mt-24 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 id="registration-heading" className="text-2xl">Pendaftaran program</h2>
          <p className="mt-2 text-lg font-bold text-primary">{price}</p>
          {canRegister ? (
            <RegistrationForm slug={program.slug} isPaid={program.is_paid} registrationId={randomUUID()} />
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {program.status === null ? "Contoh program PLA. Jadwal resmi menyusul."
                : program.status !== "OPEN" ? programStatusLabels[program.status]
                : remaining === 0 ? programStatusLabels.FULL : "Pendaftaran ditutup."}
            </p>
          )}
        </section>
      </div>

      {canRegister && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="font-bold text-primary">{price}</p>
              <p className="text-xs text-muted-foreground">Sisa {remaining} tempat</p>
            </div>
            <a href="#pendaftaran" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-bold text-accent-foreground">
              Daftar sekarang
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
