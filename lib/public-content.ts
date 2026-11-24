import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

import type { Article, Database, Json, Program } from "@/types/database";

type PublicProgram = Pick<
  Program,
  "title" | "slug" | "category" | "mode" | "is_paid" | "price" | "schedule_date" |
  "location_or_platform" | "description" | "poster_url" | "status"
>;

export const programCategoryImages: Record<Program["category"], string> = {
  Pelatihan: "/images/home/pelatihan.webp",
  Kajian: "/images/home/kajian.webp",
  Pendampingan: "/images/home/pendampingan.webp",
};

export const programStatusLabels: Record<Program["status"], string> = {
  OPEN: "Pendaftaran dibuka",
  FULL: "Kuota penuh",
  COMPLETED: "Selesai",
};

type ProgramFilters = Partial<Pick<Program, "category" | "mode" | "status">>;

type PublicArticle = Pick<Article, "title" | "slug" | "excerpt" | "thumbnail_url">;
type ArticleSummary = PublicArticle & {
  article_categories: { name: string; slug: string };
};
type ArticleDetail = ArticleSummary & Pick<Article, "content" | "published_at">;

type ProgramPreview = Omit<PublicProgram, "schedule_date" | "status"> & {
  schedule_date: string | null;
  status: Program["status"] | null;
};

const programFields =
  "title, slug, category, mode, is_paid, price, schedule_date, location_or_platform, description, poster_url, status";
const articleFields = "title, slug, excerpt, thumbnail_url";
const articleSummaryFields = `${articleFields}, article_categories!inner(name, slug)` as const;
const articleDetailFields = `${articleSummaryFields}, content, published_at` as const;
const articlePageSize = 6;

const samplePrograms: ProgramPreview[] = [
  {
    title: "Lokakarya Amanah untuk Pengurus Muda",
    slug: "lokakarya-amanah-pengurus-muda",
    category: "Pelatihan",
    mode: "Offline",
    is_paid: true,
    price: 175_000,
    schedule_date: null,
    location_or_platform: "Bandung",
    description: "Lokakarya untuk pengurus muda yang ingin membangun kebiasaan kerja tim yang bertanggung jawab, dari membagi peran hingga mengevaluasi keputusan bersama.",
    poster_url: null,
    status: null,
  },
  {
    title: "Kajian Sirah: Seni Mendengar",
    slug: "kajian-sirah-seni-mendengar",
    category: "Kajian",
    mode: "Online",
    is_paid: false,
    price: 0,
    schedule_date: null,
    location_or_platform: "Zoom",
    description: "Kajian terbuka tentang adab mendengar melalui kisah-kisah dalam sirah, dilanjutkan dengan tanya jawab dan refleksi pribadi.",
    poster_url: null,
    status: null,
  },
  {
    title: "Pendampingan Tim Dakwah Masjid",
    slug: "pendampingan-tim-dakwah-masjid",
    category: "Pendampingan",
    mode: "Online",
    is_paid: true,
    price: 350_000,
    schedule_date: null,
    location_or_platform: "Google Meet",
    description: "Sesi pendampingan untuk membantu pengurus masjid mendengarkan kebutuhan warga, merancang kegiatan, dan mengevaluasi manfaatnya.",
    poster_url: null,
    status: null,
  },
];

const sampleArticles: ArticleDetail[] = [
  {
    title: "Amanah Dimulai dari Janji Kecil",
    slug: "amanah-dimulai-dari-janji-kecil",
    excerpt: "Kebiasaan sederhana untuk melatih amanah di rumah, sekolah, dan organisasi.",
    content: "Catat setiap janji yang Anda buat, tentukan siapa yang perlu mendapat kabar, dan sampaikan perubahan sedini mungkin. Pada akhir pekan, tinjau satu janji yang terpenuhi dan satu yang perlu diperbaiki.",
    thumbnail_url: null,
    published_at: null,
    article_categories: { name: "Kepemimpinan Profetik", slug: "kepemimpinan-profetik" },
  },
  {
    title: "Belajar Bermusyawarah dari Sirah",
    slug: "belajar-bermusyawarah-dari-sirah",
    excerpt: "Cara mendengar dan merangkum pendapat sebelum mengambil keputusan bersama.",
    content: "Mulailah musyawarah dengan satu pertanyaan yang jelas. Undang setiap anggota untuk menjelaskan alasannya, rangkum perbedaan yang masih ada, lalu akhiri dengan keputusan dan pembagian tanggung jawab.",
    thumbnail_url: null,
    published_at: null,
    article_categories: { name: "Sirah dan Akhlak", slug: "sirah-dan-akhlak" },
  },
  {
    title: "Menyusun Agenda Dakwah Berbasis Kebutuhan Warga",
    slug: "agenda-dakwah-berbasis-kebutuhan-warga",
    excerpt: "Panduan singkat merancang kegiatan komunitas dari percakapan dengan warga.",
    content: "Temui beberapa warga dan tanyakan kegiatan apa yang mereka butuhkan, waktu yang memungkinkan, dan kendala untuk hadir. Uji satu kegiatan sederhana dan gunakan umpan balik peserta untuk merancang agenda berikutnya.",
    thumbnail_url: null,
    published_at: null,
    article_categories: { name: "Dakwah Komunitas", slug: "dakwah-komunitas" },
  },
  {
    title: "Menutup Rapat dengan Pembagian Tanggung Jawab",
    slug: "menutup-rapat-dengan-pembagian-tanggung-jawab",
    excerpt: "Panduan singkat agar keputusan rapat bisa ditindaklanjuti oleh tim.",
    content: "Sebelum menutup rapat, bacakan kembali keputusan yang sudah disepakati. Tanyakan siapa yang bersedia menangani setiap tugas dan kapan hasilnya perlu dibagikan.\n\nKirim catatan singkat kepada seluruh anggota. Pada pertemuan berikutnya, gunakan catatan itu untuk melihat kemajuan dan membicarakan kendala.",
    thumbnail_url: null,
    published_at: null,
    article_categories: { name: "Kepemimpinan Profetik", slug: "kepemimpinan-profetik" },
  },
];

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !URL.canParse(url) || !/^https?:\/\//i.test(url)) return null;

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(4500) }),
    },
  });
}

function publicPrograms(client: NonNullable<ReturnType<typeof createPublicClient>>) {
  return client.from("programs").select(programFields).in("status", ["OPEN", "FULL"]);
}

export async function getUpcomingPrograms(limit?: number): Promise<{ items: ProgramPreview[]; isSample: boolean }> {
  const client = createPublicClient();
  const query = client && publicPrograms(client)
    .gte("schedule_date", new Date().toISOString())
    .order("schedule_date")
    .order("slug");
  const result = query && await (limit === undefined ? query : query.limit(limit));

  const items = result?.data ?? [];
  if (!items.length) return { items: samplePrograms, isSample: true };
  return { items, isSample: false };
}

export async function getProgramCatalog({ category, mode, status }: ProgramFilters) {
  const client = createPublicClient();
  if (client) {
    const query = client.from("programs").select(programFields).order("schedule_date").order("slug");
    if (category) query.eq("category", category);
    if (mode) query.eq("mode", mode);
    if (status) query.eq("status", status);
    const result = await query;
    if (!result.error) return { items: result.data, isSample: false };
  }

  return {
    items: samplePrograms.filter((program) =>
      (!category || program.category === category)
      && (!mode || program.mode === mode)
      && (!status || program.status === status)),
    isSample: true,
  };
}

export async function getPublicProgram(slug: string) {
  const client = createPublicClient();
  const result = client && await client.from("programs")
    .select(`${programFields}, quota, registered_count, syllabus, ustadz_profiles(name, title, bio, photo_url)`)
    .eq("slug", slug).maybeSingle();

  if (result?.data) return { program: result.data, detail: result.data };
  const sample = samplePrograms.find((program) => program.slug === slug);
  return sample ? { program: sample, detail: null } : null;
}

export async function getLatestArticles(limit?: number): Promise<{ items: PublicArticle[]; isSample: boolean }> {
  const client = createPublicClient();
  const query = client && client.from("articles").select(articleFields)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .order("slug");
  const result = query && await (limit === undefined ? query : query.limit(limit));

  if (!result?.data?.length) return { items: sampleArticles.slice(0, limit), isSample: true };
  return { items: result.data, isSample: false };
}

export const getPublicArticle = cache(async (slug: string) => {
  const client = createPublicClient();
  const result = client && await client.from("articles").select(articleDetailFields)
    .eq("slug", slug)
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (result?.data) return { article: result.data, isSample: false };

  const article = sampleArticles.find((item) => item.slug === slug);
  return article ? { article, isSample: true } : null;
});

export async function getArticleListing({ category, title, page }: {
  category: string;
  title: string;
  page: number;
}) {
  const client = createPublicClient();
  if (client) {
    const now = new Date().toISOString();
    const filter = () => {
      const query = client.from("articles").select(articleSummaryFields, { count: "exact" })
        .eq("is_published", true)
        .lte("published_at", now);
      if (category) query.eq("article_categories.slug", category);
      if (title) query.ilike("title", `%${title.replace(/[\\%_]/g, "\\$&")}%`);
      return query;
    };
    const [categories, first] = await Promise.all([
      client.from("article_categories").select("name, slug").order("name"),
      filter().order("published_at", { ascending: false }).order("slug").range(0, articlePageSize - 1),
    ]);
    if (!first.error && !categories.error) {
      const hasFilters = !!(category || title);
      const available = hasFilters && !first.count
        ? await client.from("articles").select("id", { count: "exact", head: true })
          .eq("is_published", true).lte("published_at", now)
        : first;
      if (available.count || available.error) {
        const pageCount = Math.max(1, Math.ceil((first.count ?? 0) / articlePageSize));
        const currentPage = Math.min(page, pageCount);
        const start = (currentPage - 1) * articlePageSize;
        const result = currentPage === 1 ? first : await filter()
          .order("published_at", { ascending: false }).order("slug").range(start, start + articlePageSize - 1);
        if (!result.error) {
          return { items: result.data, categories: categories.data, page: currentPage, pageCount, isSample: false };
        }
      }
    }
  }

  const categories = Array.from(new Map(sampleArticles.map(({ article_categories: item }) => [item.slug, item])).values());
  const items = sampleArticles.filter((item) =>
    (!category || item.article_categories.slug === category)
    && item.title.toLocaleLowerCase("id").includes(title.toLocaleLowerCase("id")));
  const pageCount = Math.max(1, Math.ceil(items.length / articlePageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * articlePageSize;
  return { items: items.slice(start, start + articlePageSize), categories, page: currentPage, pageCount, isSample: true };
}

export async function getRelatedArticles(article: ArticleDetail, isSample: boolean): Promise<ArticleSummary[]> {
  if (isSample) {
    const others = sampleArticles.filter((item) => item.slug !== article.slug);
    return [
      ...others.filter((item) => item.article_categories.slug === article.article_categories.slug),
      ...others.filter((item) => item.article_categories.slug !== article.article_categories.slug),
    ].slice(0, 3);
  }

  const client = createPublicClient();
  if (!client) return [];
  const now = new Date().toISOString();
  const latest = () => client.from("articles").select(articleSummaryFields)
    .neq("slug", article.slug).eq("is_published", true).lte("published_at", now)
    .order("published_at", { ascending: false }).order("slug");
  const { data } = await latest().eq("article_categories.slug", article.article_categories.slug).limit(3);
  const related = data ?? [];
  if (related.length === 3) return related;
  const { data: others } = await latest().neq("article_categories.slug", article.article_categories.slug)
    .limit(3 - related.length);
  return [...related, ...(others ?? [])];
}

const productFields = "id, slug, name, description, price, stock, images_url";

export async function getPublicProducts() {
  const client = createPublicClient();
  if (!client) return { items: [], unavailable: true };
  const { data, error } = await client.from("products").select(productFields).eq("is_active", true).order("name");
  return { items: data ?? [], unavailable: Boolean(error) };
}

export async function getPublicProduct(slug: string) {
  const client = createPublicClient();
  if (!client) return null;
  const { data, error } = await client.from("products")
    .select(`${productFields}, material, weight_gram, variants`).eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw new Error("Detail merchandise belum tersedia.");
  return data;
}

export async function getPublicUstadz() {
  const client = createPublicClient();
  const result = client && await client.from("ustadz_profiles").select("id, name, title, photo_url, bio, expertise_tags")
    .eq("is_active", true).order("name").order("id");
  return result?.data ?? [];
}

type PublicSettingKey =
  | "qris_image_url" | "whatsapp_admin" | "about_content" | "vision_mission"
  | "founder_profile" | "core_values" | "contact_info" | "donation_content";

export async function getPublicSettings(...keys: PublicSettingKey[]) {
  const client = createPublicClient();
  const result = client && await client.from("site_settings").select("key, value").in("key", keys);
  return new Map<string, Json>(result?.data?.map(({ key, value }) => [key, value]));
}

const scheduleFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatProgramSchedule(scheduleDate: string | null) {
  return scheduleDate ? `${scheduleFormatter.format(new Date(scheduleDate))} WIB` : "Jadwal menyusul";
}

export function formatProgramPrice(program: Pick<Program, "is_paid" | "price">) {
  return program.is_paid ? currencyFormatter.format(program.price) : "Gratis";
}
