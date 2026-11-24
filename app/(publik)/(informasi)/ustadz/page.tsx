import type { Metadata } from "next";
import Link from "next/link";

import { UstadzDirectory } from "@/components/informasi/UstadzDirectory";
import { getPublicUstadz } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Jejaring Ustadz",
  description: "Temukan pengajar PLA untuk kajian, pelatihan, dan pendampingan komunitas.",
};
export const revalidate = 300;

const sampleProfiles = [
  {
    id: "naufal", name: "Ustadz Naufal Hakim", title: "Fasilitator Kepemimpinan Profetik",
    photo_url: "/images/ustadz/naufal.webp", bio: "Mendampingi pengurus organisasi pemuda membagi peran, berlatih musyawarah, dan mengevaluasi kerja tim.",
    expertise_tags: ["Kepemimpinan Remaja", "Manajemen Organisasi"],
  },
  {
    id: "faris", name: "Ustadz Faris Maulana", title: "Pengajar Sirah dan Akhlak",
    photo_url: "/images/ustadz/faris.webp", bio: "Memandu kajian sirah untuk remaja dan keluarga dengan fokus pada penerapan akhlak sehari-hari.",
    expertise_tags: ["Sirah Nabawiyah", "Akhlak"],
  },
  {
    id: "ridwan", name: "Ustadz Ridwan Haris", title: "Pendamping Komunitas Dakwah",
    photo_url: "/images/ustadz/ridwan.webp", bio: "Membantu relawan masjid mengenali kebutuhan warga dan merancang kegiatan dengan sumber daya setempat.",
    expertise_tags: ["Dakwah Komunitas", "Manajemen Organisasi"],
  },
];

export default async function UstadzPage() {
  const profiles = await getPublicUstadz();

  return (
    <>
      <header className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Jejaring Ustadz</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Temukan pemateri untuk kajian, pelatihan, dan pendampingan sesuai kebutuhan kegiatan Anda.
        </p>
        {!profiles.length && <p className="mt-3 text-sm font-semibold text-primary">Profil dan foto berikut adalah contoh fiktif.</p>}
      </header>
      <UstadzDirectory profiles={profiles.length ? profiles : sampleProfiles} />
      <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="text-2xl text-primary-foreground">Undang Pemateri</h2>
          <p className="mt-2 text-sm leading-relaxed">Ceritakan topik, audiens, dan jadwal yang Anda rencanakan.</p>
        </div>
        <Link href="/kontak" className="inline-flex min-h-12 shrink-0 items-center rounded-lg bg-accent px-5 text-sm font-bold text-primary outline-accent hover:bg-accent-hover">
          Hubungi PLA
        </Link>
      </section>
    </>
  );
}
