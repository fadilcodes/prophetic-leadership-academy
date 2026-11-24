import { FilterForm } from "@/components/ui/FilterForm";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCards } from "@/components/home/HomeBottomSections";
import { getArticleListing } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Edukasi & Artikel",
  description: "Baca artikel gratis tentang kepemimpinan profetik, sirah, akhlak, dan dakwah komunitas.",
};

function listingUrl(category: string, title: string, page = 1) {
  const params = new URLSearchParams();
  if (category) params.set("kategori", category);
  if (title) params.set("q", title);
  if (page > 1) params.set("halaman", String(page));
  return params.size ? `/edukasi?${params}` : "/edukasi";
}

export default async function EducationPage({ searchParams }: PageProps<"/edukasi">) {
  const params = await searchParams;
  const title = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const category = typeof params.kategori === "string" ? params.kategori.slice(0, 100) : "";
  const requestedPage = Number(params.halaman);
  const result = await getArticleListing({
    title,
    category,
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  });

  return (
    <>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Edukasi &amp; Artikel</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Bacaan gratis tentang kepemimpinan profetik, sirah, dan dakwah komunitas.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-5 rounded-2xl border bg-card p-4 sm:p-6">
        <FilterForm key={JSON.stringify([category, title])} action="/edukasi" role="search" className="flex flex-wrap gap-2">
          {category && <input type="hidden" name="kategori" value={category} />}
          <label htmlFor="article-search" className="sr-only">Cari judul artikel</label>
          <div className="relative min-w-40 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3 size-5 text-primary" />
            <input
              id="article-search"
              type="search"
              name="q"
              key={title}
              defaultValue={title}
              maxLength={120}
              placeholder="Cari judul artikel"
              className="min-h-12 w-full rounded-lg border bg-background py-2 pr-3 pl-10"
            />
          </div>
          <SubmitButton className="min-h-12 rounded-lg bg-accent px-5 text-sm font-bold text-accent-foreground enabled:hover:bg-accent-hover">Cari</SubmitButton>
        </FilterForm>
        <nav aria-label="Kategori artikel" className="flex flex-wrap gap-2">
          {[{ name: "Semua kategori", slug: "" }, ...result.categories].map(({ name, slug }) => (
            <Link
              key={slug}
              href={listingUrl(slug, title)}
              aria-current={category === slug ? "true" : undefined}
              className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold text-primary hover:border-accent aria-[current=true]:border-primary aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
            >
              {name}
            </Link>
          ))}
        </nav>
      </div>

      {result.items.length ? <ArticleCards items={result.items} isSample={result.isSample} /> : (
        <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold text-primary">Tidak ada artikel yang cocok.</p>
          <Link href="/edukasi" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-primary underline underline-offset-4">
            Hapus filter
          </Link>
        </div>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Halaman artikel" className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {result.page > 1 && (
            <Link href={listingUrl(category, title, result.page - 1)} rel="prev" className="inline-flex min-h-11 items-center rounded-lg border bg-card px-4 text-sm font-bold text-primary">
              Sebelumnya
            </Link>
          )}
          <span className="px-2 text-sm text-muted-foreground">Halaman {result.page} dari {result.pageCount}</span>
          {result.page < result.pageCount && (
            <Link href={listingUrl(category, title, result.page + 1)} rel="next" className="inline-flex min-h-11 items-center rounded-lg border bg-card px-4 text-sm font-bold text-primary">
              Berikutnya
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
