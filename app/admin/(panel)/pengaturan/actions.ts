"use server";

import { randomUUID } from "node:crypto";

import { requireAdmin } from "@/lib/admin/auth";
import { finishMutation, formLines, formText, imageField, mutationFailed } from "@/lib/admin/forms";
import { settingObject, whatsappNumber } from "@/lib/site-information";

const bucket = "pla-public-media";
const maxImageBytes = 2 * 1024 * 1024;

async function getImageExtension(file: File) {
  if (file.size > maxImageBytes) return null;
  const bytes = Buffer.from(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (file.type === "image/jpeg" && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "jpg";
  if (file.type === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function saveSettings(form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/pengaturan";
  const about = formText(form, "about", 20_000);
  const vision = formText(form, "vision", 5000);
  const mission = formLines(form, "mission");
  const photo = imageField(form, "founder_photo");
  const wa = formText(form, "whatsapp", 30);
  const whatsapp = whatsappNumber(wa);
  if (!about || !vision || !mission.length || photo === undefined || (wa && !whatsapp)) mutationFailed(path);

  const current = await db.from("site_settings")
    .select("key, value").in("key", ["about_content", "vision_mission", "founder_profile"]);
  if (current.error) mutationFailed(path, "database");
  const settings = new Map(current.data.map((row) => [row.key, row.value]));
  const rows = [
    { key: "about_content", value: { ...settingObject(settings.get("about_content")), content: about } },
    { key: "vision_mission", value: { ...settingObject(settings.get("vision_mission")), vision, mission } },
    { key: "founder_profile", value: {
      ...settingObject(settings.get("founder_profile")),
      name: formText(form, "founder_name", 150), title: formText(form, "founder_title", 180),
      bio: formText(form, "founder_bio"), photo_url: photo,
    } },
    { key: "whatsapp_admin", value: whatsapp ?? "" },
  ];

  const file = form.get("qris");
  let objectPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const extension = await getImageExtension(file);
    if (!extension) mutationFailed(path, "image");
    objectPath = `qris/${randomUUID()}.${extension}`;
    const storage = db.storage.from(bucket);
    const { error } = await storage.upload(objectPath, file, { contentType: file.type, cacheControl: "3600" });
    if (error) mutationFailed(path, "storage");
    rows.push({ key: "qris_image_url", value: storage.getPublicUrl(objectPath).data.publicUrl });
  }

  const { error } = await db.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    // The next read confirms the URL was not committed before removing an unreferenced upload.
    if (objectPath) {
      const currentQris = await db.from("site_settings").select("value").eq("key", "qris_image_url").maybeSingle();
      if (!currentQris.error && currentQris.data?.value !== rows.at(-1)?.value) await db.storage.from(bucket).remove([objectPath]);
    }
    mutationFailed(path, "database");
  }

  finishMutation(path, ["/tentang-pla", "/donasi", "/kontak", "/"]);
}
