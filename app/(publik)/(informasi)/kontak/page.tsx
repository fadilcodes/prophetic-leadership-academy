import { Building2, GraduationCap, Mail, MapPin, MessageCircle, UsersRound } from "lucide-react";
import type { Metadata } from "next";

import { getContactInformation, whatsappLink } from "@/lib/site-information";

export const metadata: Metadata = {
  title: "Kontak & Kerja Sama",
  description: "Hubungi PLA untuk pertanyaan umum, kolaborasi pendidikan, atau program in-house.",
};
export const revalidate = 300;

const inquiries = [
  {
    icon: MessageCircle,
    title: "Pertanyaan Umum",
    description: "Tanyakan informasi tentang PLA, program, atau kegiatan kami.",
    message: "Assalamu'alaikum Admin PLA, saya ingin menanyakan informasi berikut:\n- Nama:\n- Pertanyaan:",
  },
  {
    icon: GraduationCap,
    title: "Kerja Sama Sekolah / Kampus / Pesantren",
    description: "Diskusikan peluang kolaborasi antara institusi Anda dan PLA.",
    message: "Assalamu'alaikum Admin PLA, kami ingin berdiskusi tentang kerja sama.\n- Nama dan jabatan:\n- Nama sekolah/kampus/pesantren:\n- Bentuk kerja sama yang diusulkan:\n- Waktu yang direncanakan:",
  },
  {
    icon: UsersRound,
    title: "Permintaan Program In-House / Pelatihan Custom",
    description: "Rancang kajian atau pelatihan sesuai topik dan kebutuhan peserta Anda.",
    message: "Assalamu'alaikum Admin PLA, kami ingin menanyakan program in-house atau pelatihan custom.\n- Nama dan instansi:\n- Topik pelatihan:\n- Jumlah dan profil peserta:\n- Jadwal dan lokasi yang diusulkan:",
  },
];

export default async function ContactPage() {
  const contact = await getContactInformation();

  return (
    <>
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Kontak &amp; Kerja Sama</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Hubungi Prophetic Leadership Academy untuk pertanyaan, kolaborasi pendidikan, dan pelatihan institusi.
        </p>
      </header>

      <section aria-labelledby="official-contact" className="mt-8 rounded-2xl border bg-card p-6 sm:p-8">
        <h2 id="official-contact" className="text-2xl">Kontak Resmi PLA</h2>
        <address className="mt-5 grid gap-5 text-sm not-italic sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex min-w-0 gap-3">
            <MessageCircle aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-primary">WhatsApp</p>
              {contact.number ? (
                <a href={`https://wa.me/${contact.number}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block underline underline-offset-4">+{contact.number}</a>
              ) : <p className="mt-1 text-muted-foreground">Belum tersedia</p>}
            </div>
          </div>
          <div className="flex min-w-0 gap-3">
            <Mail aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-bold text-primary">Email</p>
              {contact.email ? (
                <a href={`mailto:${encodeURIComponent(contact.email).replace("%40", "@")}`} className="mt-1 inline-block break-all underline underline-offset-4">{contact.email}</a>
              ) : <p className="mt-1 text-muted-foreground">Belum tersedia</p>}
            </div>
          </div>
          <div className="flex min-w-0 gap-3">
            <MapPin aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-primary">Alamat</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{contact.address || "Belum tersedia"}</p>
              {contact.mapsUrl && (
                <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">
                  Buka peta
                </a>
              )}
            </div>
          </div>
          <div className="flex min-w-0 gap-3">
            <Building2 aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-primary">Media Sosial</p>
              {contact.socials.length ? (
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-2">
                  {contact.socials.map(({ label, url }, index) => (
                    <li key={index}><a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{label}</a></li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-muted-foreground">Belum tersedia</p>}
            </div>
          </div>
        </address>
      </section>

      <section aria-labelledby="inquiry-types" className="mt-10">
        <h2 id="inquiry-types" className="text-3xl tracking-tight">Pilih Topik Pesan</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {inquiries.map(({ icon: Icon, title, description, message }) => (
            <article key={title} className="flex flex-col rounded-2xl border bg-card p-5 sm:p-6">
              <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.6} />
              </span>
              <h3 className="mt-4 text-2xl leading-tight">{title}</h3>
              <p className="mt-3 mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              {contact.number ? (
                <a
                  href={whatsappLink(contact.number, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Buka WhatsApp untuk ${title}`}
                  className="mt-auto inline-flex min-h-11 self-start items-center rounded-lg bg-accent px-4 text-sm font-bold text-primary hover:bg-accent/80"
                >
                  Buka WhatsApp
                </a>
              ) : <p className="mt-auto text-sm font-semibold text-muted-foreground">WhatsApp belum tersedia</p>}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
