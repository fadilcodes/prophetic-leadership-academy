import "server-only";

import type { Json } from "@/types/database";

import { getPublicSettings } from "./public-content";
import { getHttpsUrl } from "./public-url";

export function settingObject(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function settingText(value: Json | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function settingList(value: Json | undefined) {
  return Array.isArray(value) ? value.map(settingText).filter(Boolean) : [];
}

export function whatsappNumber(value: Json | undefined) {
  const text = settingText(value);
  if (!/^\+?[\d ().-]+$/.test(text)) return null;
  const digits = text.replace(/\D/g, "").replace(/^00/, "");
  const international = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return /^[1-9]\d{7,14}$/.test(international) ? international : null;
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export async function getContactInformation() {
  const settings = await getPublicSettings("contact_info", "whatsapp_admin");
  const contact = settingObject(settings.get("contact_info"));
  const email = settingText(contact.email);
  const number = whatsappNumber(settings.get("whatsapp_admin")) ?? whatsappNumber(process.env.ADMIN_WHATSAPP_NUMBER);
  const socials = Array.isArray(contact.social_links) ? contact.social_links.flatMap((value) => {
    const social = settingObject(value);
    const label = settingText(social.label);
    const url = getHttpsUrl(social.url);
    return label && url ? [{ label, url }] : [];
  }) : [];

  return {
    number,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "",
    address: settingText(contact.address),
    mapsUrl: getHttpsUrl(contact.maps_url),
    socials,
  };
}
