import { BookOpen, Compass, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPublicSettings } from "@/lib/public-content";
import { getPublicImageUrl } from "@/lib/public-url";
import { settingList, settingObject, settingText } from "@/lib/site-information";

export const metadata: Metadata = {
  title: "Tentang PLA",
  description: "Kenali profil, visi, misi, dan nilai utama Prophetic Leadership Academy.",
};
export const revalidate = 300;

const defaultMission = [
  "Menyediakan pendidikan kepemimpinan profetik yang mudah diakses.",
  "Mendampingi sekolah, kampus, pesantren, dan komunitas dalam merancang kegiatan yang bermanfaat.",
  "Membiasakan musyawarah, refleksi, dan pelayanan dalam praktik kepemimpinan.",
];

const defaultValues = [
  { title: "Amanah", description: "Menjaga tanggung jawab dan menepati kesepakatan, termasuk dalam keputusan sehari-hari." },
  { title: "Keteladanan", description: "Menerjemahkan nilai yang dipelajari menjadi perilaku yang bisa ditiru." },
  { title: "Musyawarah", description: "Mendengar dengan saksama dan memberi ruang bagi orang lain untuk ikut menentukan keputusan." },
  { title: "Pelayanan", description: "Mengukur kepemimpinan dari manfaat yang benar-benar dirasakan oleh orang lain." },
];

export default async function AboutPage() {
  const settings = await getPublicSettings("about_content", "vision_mission", "core_values", "founder_profile");
  const about = settings.get("about_content");
  const visionMission = settingObject(settings.get("vision_mission"));
  const founder = settingObject(settings.get("founder_profile"));
  const narrative = settingText(about) || settingText(settingObject(about).content) ||
    "Prophetic Leadership Academy (PLA) adalah ruang belajar untuk menumbuhkan kepemimpinan yang berlandaskan keteladanan Rasulullah ﷺ. Melalui kajian, pelatihan, dan pendampingan, peserta berlatih menerapkan amanah, musyawarah, dan pelayanan dalam kehidupan sehari-hari.";
  const vision = settingText(visionMission.vision) || "Menumbuhkan pemimpin berakhlak yang tangguh, adaptif, dan membawa manfaat bagi masyarakat.";
  const mission = settingList(visionMission.mission);
  const missionText = settingText(visionMission.mission);
  const values = settings.get("core_values") ?? visionMission.core_values;
  const coreValues = Array.isArray(values) ? values.flatMap((value) => {
    const item = settingObject(value);
    const title = settingText(item.title) || settingText(value);
    return title ? [{ title, description: settingText(item.description) }] : [];
  }) : [];
  const founderName = settingText(founder.name);
  const founderTitle = settingText(founder.title) || "Pendiri PLA";
  const founderBio = settingText(founder.bio);
  const founderPhoto = getPublicImageUrl(founder.photo_url);

  return (
    <>
      <header className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-48 size-96 rounded-t-full border border-accent/35" />
        <div className="relative max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Tentang PLA</h1>
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-primary-foreground/90 sm:text-lg">{narrative}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section aria-labelledby="pla-vision" className="rounded-2xl border bg-card p-6 sm:p-8">
          <Compass aria-hidden="true" className="mb-3 size-7 text-primary" strokeWidth={1.5} />
          <h2 id="pla-vision" className="text-3xl">Visi</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{vision}</p>
        </section>
        <section aria-labelledby="pla-mission" className="rounded-2xl border bg-card p-6 sm:p-8">
          <BookOpen aria-hidden="true" className="mb-3 size-7 text-primary" strokeWidth={1.5} />
          <h2 id="pla-mission" className="text-3xl">Misi</h2>
          {missionText ? <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{missionText}</p> : (
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground marker:text-primary">
              {(mission.length ? mission : defaultMission).map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="pla-values" className="mt-12">
        <h2 id="pla-values" className="text-3xl tracking-tight">Nilai-Nilai Utama</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(coreValues.length ? coreValues : defaultValues).map(({ title, description }, index) => (
            <article key={index} className="rounded-2xl border bg-card p-5">
              <span aria-hidden="true" className="mb-3 block h-px w-8 bg-accent" />
              <h3 className="text-xl">{title}</h3>
              {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="pla-founder" className="mt-12">
        <h2 id="pla-founder" className="text-3xl tracking-tight">Profil Founder</h2>
        <div className="mt-5 flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="relative grid aspect-square w-full max-w-44 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-primary">
            {founderPhoto ? (
              <Image src={founderPhoto} alt={founderName || "Pendiri PLA"} fill sizes="176px" unoptimized={!founderPhoto.startsWith("/")} className="object-cover" />
            ) : <UserRound aria-hidden="true" className="size-16 opacity-65" strokeWidth={1.2} />}
          </div>
          <div>
            <h3 className="text-2xl">{founderName || founderTitle}</h3>
            {founderName && <p className="mt-2 text-sm font-semibold text-primary">{founderTitle}</p>}
            <p className="mt-3 max-w-2xl whitespace-pre-line leading-relaxed text-muted-foreground">
              {founderBio || "Informasi resmi mengenai pendiri PLA belum tersedia di situs ini."}
            </p>
          </div>
        </div>
      </section>
      <Link href="/program" className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-accent px-5 text-sm font-bold text-primary">Jelajahi Program</Link>
    </>
  );
}
