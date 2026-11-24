import { SubmitButton } from "@/components/ui/SubmitButton";

import Image from "next/image";

import { saveSettings } from "./actions";
import { Field, Notice, inputClass, labelClass, primaryButton } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/admin/auth";
import { getPublicImageUrl } from "@/lib/public-url";
import { settingList, settingObject, settingText } from "@/lib/site-information";

export default async function SettingsAdmin({ searchParams }: PageProps<"/admin/pengaturan">) {
  const db = await requireAdmin();
  const { data, error } = await db.from("site_settings").select("key, value")
    .in("key", ["about_content", "vision_mission", "founder_profile", "qris_image_url", "whatsapp_admin"]);
  if (error) throw new Error("Pengaturan belum dapat dimuat.");
  const settings = new Map(data.map(({ key, value }) => [key, value]));
  const about = settings.get("about_content");
  const visionMission = settingObject(settings.get("vision_mission"));
  const founder = settingObject(settings.get("founder_profile"));
  const qris = getPublicImageUrl(settings.get("qris_image_url"));

  return (
    <>
      <h1 className="text-4xl">Pengaturan Website</h1>
      <Notice params={await searchParams} />
      <form action={saveSettings} className="mt-6 grid gap-5">
        <section className="grid gap-4 rounded-xl border bg-card p-5">
          <h2 className="text-2xl">Tentang PLA</h2>
          <Field name="about" label="Profil akademi" value={settingText(about) || settingText(settingObject(about).content)}
            maxLength={20_000} area required />
          <Field name="vision" label="Visi" value={settingText(visionMission.vision)} area maxLength={5000} required />
          <Field name="mission" label="Misi (satu poin per baris)" value={settingText(visionMission.mission) || settingList(visionMission.mission).join("\n")}
            area maxLength={20_000} required />
          <h3 className="text-xl">Profil Founder</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="founder_name" label="Nama founder" value={settingText(founder.name)} maxLength={150} />
            <Field name="founder_title" label="Jabatan" value={settingText(founder.title)} maxLength={180} />
          </div>
          <Field name="founder_photo" label="URL foto founder" value={settingText(founder.photo_url)} maxLength={2048} />
          <Field name="founder_bio" label="Biografi founder" value={settingText(founder.bio)} area maxLength={20_000} />
        </section>
        <section className="grid gap-4 rounded-xl border bg-card p-5">
          <h2 className="text-2xl">Donasi & Kontak</h2>
          {qris && <Image src={qris} alt="QRIS donasi saat ini" width={168} height={168} unoptimized={!qris.startsWith("/")}
            className="h-auto max-w-full rounded-lg border object-contain" />}
          <label className={labelClass}>{qris ? "Ganti gambar QRIS donasi" : "Unggah gambar QRIS donasi"}
            <input name="qris" type="file" accept="image/png,image/jpeg,image/webp" className={inputClass} />
            <span className="font-normal text-muted-foreground">PNG, JPG, atau WebP. Maksimal 2 MB.</span>
          </label>
          <Field name="whatsapp" label="Nomor WhatsApp resmi" type="tel" value={settingText(settings.get("whatsapp_admin"))} maxLength={30} />
        </section>
        <div><SubmitButton className={primaryButton}>Simpan pengaturan</SubmitButton></div>
      </form>
    </>
  );
}
