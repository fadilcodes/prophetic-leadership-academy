"use server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  databaseErrorCode, finishMutation, formLines, formText, imageField, integerField, mutationFailed, queryChoice, slugField, validId,
} from "@/lib/admin/forms";
import { getPublicImageUrl } from "@/lib/public-url";

const articlePaths = ["/", "/edukasi", "/edukasi/[slug]"];
const ustadzPaths = ["/ustadz", "/program/[slug]"];
const productPaths = ["/merchandise", "/merchandise/[slug]"];
const programPaths = ["/", "/program", "/program/[slug]"];

const tables = {
  article: { table: "articles", path: "/admin/artikel", paths: articlePaths },
  category: { table: "article_categories", path: "/admin/artikel", paths: articlePaths },
  ustadz: { table: "ustadz_profiles", path: "/admin/ustadz", paths: ustadzPaths },
  product: { table: "products", path: "/admin/produk", paths: productPaths },
  program: { table: "programs", path: "/admin/program", paths: programPaths },
} as const;

export async function deleteContent(kind: keyof typeof tables, form: FormData) {
  const db = await requireAdmin();
  if (!Object.hasOwn(tables, kind)) return;
  const { table, path, paths } = tables[kind];
  const id = validId(form.get("id"));
  if (!id) mutationFailed(path);
  const { error, data } = await db.from(table).delete().eq("id", id).select("id").maybeSingle();
  if (error) mutationFailed(path, databaseErrorCode(error));
  if (!data) mutationFailed(path, "missing");
  finishMutation(path, paths);
}

export async function saveArticle(form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/artikel";
  const id = validId(form.get("id"));
  const title = formText(form, "title", 180);
  const slug = slugField(form);
  const category_id = validId(form.get("category_id"));
  const excerpt = formText(form, "excerpt", 500);
  const content = formText(form, "content", 100_000);
  const thumbnail_url = imageField(form, "thumbnail_url");
  const is_published = form.get("is_published") === "on";
  if ((form.has("id") && !id) || !title || !slug || !category_id || !excerpt || !content || thumbnail_url === undefined) {
    mutationFailed(path, "invalid", id);
  }

  let published_at: string | null = is_published ? new Date().toISOString() : null;
  if (id && is_published) {
    const existing = await db.from("articles").select("is_published, published_at").eq("id", id).maybeSingle();
    if (existing.error || !existing.data) mutationFailed(path, "missing", id);
    if (existing.data.is_published) published_at = existing.data.published_at;
  }

  const values = { title, slug, category_id, excerpt, content, thumbnail_url, is_published, published_at };
  const query = id ? db.from("articles").update(values).eq("id", id) : db.from("articles").insert(values);
  const { error, data } = await query.select("id").maybeSingle();
  if (error) mutationFailed(path, databaseErrorCode(error), id);
  if (!data) mutationFailed(path, "missing", id);
  finishMutation(path, articlePaths);
}

export async function toggleArticle(id: string, publish: boolean, _form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/artikel";
  if (!validId(id) || typeof publish !== "boolean") mutationFailed(path);
  const { error } = await db.from("articles")
    .update({ is_published: publish, published_at: publish ? new Date().toISOString() : null })
    .eq("id", id).eq("is_published", !publish);
  if (error) mutationFailed(path, databaseErrorCode(error));
  finishMutation(path, articlePaths);
}

export async function saveCategory(form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/artikel";
  const id = validId(form.get("id"));
  const name = formText(form, "name", 100);
  const slug = slugField(form);
  if ((form.has("id") && !id) || !name || !slug) mutationFailed(path);

  const query = id ? db.from("article_categories").update({ name, slug }).eq("id", id)
    : db.from("article_categories").insert({ name, slug });
  const { error, data } = await query.select("id").maybeSingle();
  if (error) mutationFailed(path, databaseErrorCode(error));
  if (!data) mutationFailed(path, "missing");
  finishMutation(path, articlePaths);
}

export async function saveUstadz(form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/ustadz";
  const id = validId(form.get("id"));
  const name = formText(form, "name", 150);
  const title = formText(form, "title", 180);
  const bio = formText(form, "bio");
  const photo_url = imageField(form, "photo_url");
  if ((form.has("id") && !id) || !name || !title || !bio || photo_url === undefined) mutationFailed(path, "invalid", id);

  const values = { name, title, bio, photo_url, expertise_tags: formLines(form, "expertise_tags"), is_active: form.get("is_active") === "on" };
  const query = id ? db.from("ustadz_profiles").update(values).eq("id", id) : db.from("ustadz_profiles").insert(values);
  const { error, data } = await query.select("id").maybeSingle();
  if (error) mutationFailed(path, databaseErrorCode(error), id);
  if (!data) mutationFailed(path, "missing", id);
  finishMutation(path, ustadzPaths);
}

export async function toggleUstadz(id: string, active: boolean, _form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/ustadz";
  if (!validId(id) || typeof active !== "boolean") mutationFailed(path);
  const { error } = await db.from("ustadz_profiles").update({ is_active: active }).eq("id", id);
  if (error) mutationFailed(path, databaseErrorCode(error));
  finishMutation(path, ustadzPaths);
}

export async function saveProduct(form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/produk";
  const id = validId(form.get("id"));
  const name = formText(form, "name", 180);
  const slug = slugField(form);
  const description = formText(form, "description");
  const price = integerField(form, "price");
  const stock = integerField(form, "stock");
  const previousStock = integerField(form, "previous_stock");
  const weight_gram = integerField(form, "weight_gram", 1);
  const images = formLines(form, "images_url").map(getPublicImageUrl);
  const variants = formLines(form, "variants");
  if ((form.has("id") && (!id || previousStock === null)) || !name || !slug || !description || price === null
    || stock === null || weight_gram === null || images.some((url) => url === null) || variants.some((entry) => entry.length > 100)) {
    mutationFailed(path, "invalid", id);
  }

  const values = {
    name, slug, description, price, weight_gram, material: formText(form, "material", 400) || null, variants,
    images_url: images.filter((url): url is string => url !== null), is_active: form.get("is_active") === "on",
  };
  const query = !id ? db.from("products").insert({ ...values, stock })
    : stock === previousStock ? db.from("products").update(values).eq("id", id)
      : db.from("products").update({ ...values, stock }).eq("id", id).eq("stock", previousStock ?? -1);
  const { error, data } = await query.select("id").maybeSingle();
  if (error) mutationFailed(path, databaseErrorCode(error), id);
  if (!data) mutationFailed(path, "missing", id);
  finishMutation(path, productPaths);
}

export async function saveProgram(form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/program";
  const id = validId(form.get("id"));
  const title = formText(form, "title", 180);
  const slug = slugField(form);
  const category = queryChoice(formText(form, "category"), ["Pelatihan", "Kajian", "Pendampingan"] as const);
  const mode = queryChoice(formText(form, "mode"), ["Online", "Offline"] as const);
  const status = queryChoice(formText(form, "status"), ["OPEN", "FULL", "COMPLETED"] as const);
  const speaker = formText(form, "ustadz_id");
  const ustadz_id = validId(speaker);
  const price = integerField(form, "price");
  const quota = integerField(form, "quota", 1);
  const description = formText(form, "description");
  const location_or_platform = formText(form, "location_or_platform", 300);
  const poster_url = imageField(form, "poster_url");
  const schedule = formText(form, "schedule_date", 30);
  const scheduleTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(schedule) ? Date.parse(`${schedule}:00+07:00`) : NaN;
  if ((form.has("id") && !id) || !title || !slug || slug === "sukses" || !category || !mode || !status || (speaker && !ustadz_id)
    || price === null || quota === null || !description || !location_or_platform || poster_url === undefined || !Number.isFinite(scheduleTime)) {
    mutationFailed(path, "invalid", id);
  }
  const values = {
    title, slug, category, mode, status, ustadz_id, price, is_paid: price > 0, quota, description,
    location_or_platform, poster_url, schedule_date: new Date(scheduleTime).toISOString(), syllabus: formLines(form, "syllabus"),
  };
  const query = id ? db.from("programs").update(values).eq("id", id) : db.from("programs").insert(values);
  const { error, data } = await query.select("id").maybeSingle();
  if (error) mutationFailed(path, databaseErrorCode(error), id);
  if (!data) mutationFailed(path, "missing", id);
  finishMutation(path, programPaths, data.id);
}

export async function saveProgramAccess(form: FormData) {
  const db = await requireAdmin();
  const path = "/admin/program";
  const id = validId(form.get("id"));
  if (!id) mutationFailed(path);
  const details = formText(form, "details");
  const { error } = details
    ? await db.from("program_access_details").upsert({ program_id: id, details }, { onConflict: "program_id" })
    : await db.from("program_access_details").delete().eq("program_id", id);
  if (error) mutationFailed(path, databaseErrorCode(error), id);
  finishMutation(path, [], id);
}
