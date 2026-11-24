import { MessageCircle, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { QrisDownload } from "@/components/informasi/QrisDownload";
import { getPublicSettings } from "@/lib/public-content";
import { getPublicImageUrl } from "@/lib/public-url";
import { settingText, whatsappLink, whatsappNumber } from "@/lib/site-information";

export const metadata: Metadata = {
  title: "Donasi Dakwah",
  description: "Dukung kegiatan pendidikan dan dakwah PLA melalui donasi QRIS.",
};
export const revalidate = 300;

const confirmation = `Assalamu'alaikum Admin PLA, saya ingin mengonfirmasi donasi program dakwah:
- Nama:
- Nominal Donasi:
- Tanggal Transfer:
(Lampirkan bukti transfer QRIS)`;

const steps = [
  "Buka aplikasi pembayaran atau mobile banking yang mendukung QRIS.",
  "Pindai kode resmi di halaman ini. Jika memakai satu perangkat, unduh gambar dan pilih dari galeri.",
  "Periksa nama penerima, masukkan nominal, lalu simpan bukti pembayaran.",
  "Konfirmasi melalui WhatsApp dan lampirkan bukti transfer.",
];

export default async function DonationPage() {
  const settings = await getPublicSettings("qris_image_url", "whatsapp_admin", "donation_content");
  const imageUrl = getPublicImageUrl(settings.get("qris_image_url"));
  const number = whatsappNumber(settings.get("whatsapp_admin")) ?? whatsappNumber(process.env.ADMIN_WHATSAPP_NUMBER);
  const overview = settingText(settings.get("donation_content")) ||
    "Dukungan Anda membantu PLA menyiapkan materi edukasi, menyelenggarakan kajian, dan mendampingi komunitas dakwah. Donasi dilakukan melalui QRIS dengan nominal pilihan Anda.";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Donasi Dakwah</h1>
        <p className="mt-5 max-w-xl whitespace-pre-line leading-relaxed text-muted-foreground">{overview}</p>
        <section aria-labelledby="donation-steps" className="mt-8 rounded-2xl border bg-card p-5 sm:p-7">
          <h2 id="donation-steps" className="text-2xl">Cara Donasi</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed marker:font-bold marker:text-primary">
            {steps.map((step) => <li key={step} className="pl-1">{step}</li>)}
          </ol>
        </section>
        <div className="mt-6">
          {number ? (
            <a
              href={whatsappLink(number, confirmation)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-primary hover:bg-accent/80"
            >
              <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
              Konfirmasi Donasi via WhatsApp
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              WhatsApp konfirmasi belum tersedia.{" "}
              <Link href="/kontak" className="font-semibold text-primary underline underline-offset-4">Lihat halaman kontak</Link>.
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="qris-title" className="rounded-2xl border border-accent/40 bg-card p-5 text-center shadow-sm sm:p-7">
        <h2 id="qris-title" className="text-2xl">QRIS Donasi PLA</h2>
        <div className="relative mx-auto mt-4 grid min-h-48 w-full max-w-sm place-items-center rounded-xl border bg-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Kode QRIS resmi untuk donasi PLA"
              width={900}
              height={900}
              unoptimized
              className="h-auto max-h-[30rem] w-full rounded-xl object-contain"
            />
          ) : (
            <div className="grid aspect-square w-full place-content-center gap-3 p-5 text-primary">
              <QrCode aria-hidden="true" className="mx-auto size-16 opacity-55" strokeWidth={1.25} />
              <p className="text-sm font-bold">Kode QRIS resmi belum tersedia</p>
              <p className="text-sm text-muted-foreground">Gambar ini hanya placeholder.</p>
            </div>
          )}
        </div>
        <QrisDownload imageUrl={imageUrl} />
      </section>
    </div>
  );
}
