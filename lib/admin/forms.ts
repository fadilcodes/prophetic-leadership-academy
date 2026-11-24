import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { uuidPattern } from "@/lib/merchandise";
import { getPublicImageUrl } from "@/lib/public-url";

export type AdminQuery = Record<string, string | string[] | undefined>;
export const pageSize = 30;

export function pageNumber(value: AdminQuery["page"]) {
  const n = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 1_000_000) : 1;
}

export function queryChoice<T extends string>(value: string | string[] | undefined, options: readonly T[]) {
  return options.find((option) => option === value);
}

export function validId(value: unknown) {
  return typeof value === "string" && uuidPattern.test(value) ? value : null;
}

export function formText(form: FormData, key: string, max = 20_000) {
  const raw = form.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length <= max ? value : "";
}

export function integerField(form: FormData, key: string, min = 0) {
  const raw = formText(form, key, 12);
  const value = Number(raw);
  return /^\d+$/.test(raw) && value >= min && value <= 2_147_483_647 ? value : null;
}

export function formLines(form: FormData, key: string) {
  return [...new Set(formText(form, key).split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
}

export function imageField(form: FormData, key: string) {
  const value = formText(form, key, 2048);
  return value ? getPublicImageUrl(value) ?? undefined : null;
}

export function slugField(form: FormData) {
  const slug = formText(form, "slug", 160).toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export function mutationFailed(path: string, code = "invalid", edit?: string | null): never {
  const query = new URLSearchParams({ error: code });
  if (edit) query.set("edit", edit);
  redirect(`${path}?${query}`);
}

export function finishMutation(path: string, publicPaths: string[] = [], edit?: string | null): never {
  for (const url of publicPaths) revalidatePath(url, url.includes("[") ? "page" : undefined);
  revalidatePath(path);
  const query = new URLSearchParams({ saved: "1" });
  if (edit) query.set("edit", edit);
  redirect(`${path}?${query}`);
}

export function databaseErrorCode(error: { code: string; message: string }) {
  if (error.code === "23505") return "duplicate";
  if (error.code === "23503") return "relation";
  if (error.code === "23514" || error.message === "PROGRAM_CAPACITY") return "constraint";
  return "database";
}

export const formatAdminDate = (date: string) => new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
}).format(new Date(date));
