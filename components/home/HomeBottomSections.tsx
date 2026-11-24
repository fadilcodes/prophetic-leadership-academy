import Link from "next/link";

import { getLatestArticles } from "@/lib/public-content";

import { ContentImage } from "./ContentImage";

const articleImages = [
  "/images/home/amanah.webp",
  "/images/home/sirah.webp",
  "/images/home/komunitas.webp",
] as const;

export async function HomeBottomSections() {
  const { items, isSample } = await getLatestArticles(3);

  return (
    <>
      <section aria-labelledby="article-title" className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-15 sm:px-6 sm:py-20 lg:px-8">
          <h2 id="article-title" className="text-center text-3xl tracking-tight text-balance sm:text-4xl">
            Edukasi &amp; Artikel Terbaru
          </h2>
          <ArticleCards items={items} isSample={isSample} />
          <div className="mt-9 flex justify-center">
            <Link
              href="/edukasi"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-accent px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-accent/15"
            >
              Lihat Semua Artikel
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="collaboration-title" className="bg-background pb-12 sm:pb-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-2xl bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-11 lg:px-12">
            <span aria-hidden="true" className="pointer-events-none absolute -right-16 -bottom-40 -z-10 size-96 rounded-t-full border border-accent/25" />
            <span aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-40 -z-10 size-83 rounded-t-full border border-accent/25" />
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <span aria-hidden="true" className="mb-4 block h-px w-12 bg-accent" />
                <h2 id="collaboration-title" className="max-w-2xl text-3xl tracking-tight text-balance text-white sm:text-4xl">
                  Kolaborasi Sekolah, Kampus &amp; Pesantren
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-primary-foreground/90">
                  Rancang program <i>in-house</i> bersama PLA sesuai kebutuhan peserta di institusi Anda.
                </p>
              </div>
              <Link
                href="/kontak"
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-bold text-accent-foreground outline-accent transition-colors hover:bg-[#D8B870]"
              >
                Hubungi PLA
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

type ArticleCardsProps = Omit<Awaited<ReturnType<typeof getLatestArticles>>, "items"> & {
  items: (Awaited<ReturnType<typeof getLatestArticles>>["items"][number] & {
    article_categories?: { name: string };
  })[];
};

export function ArticleCards({ items, isSample }: ArticleCardsProps) {
  return (
    <>
    {isSample && <p className="mt-3 text-center text-sm text-muted-foreground">Contoh bacaan dari PLA.</p>}
    <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((article, index) => (
        <article key={article.slug} className="min-w-0">
          <Link
            href={`/edukasi/${encodeURIComponent(article.slug)}`}
            className="block h-full overflow-hidden rounded-2xl border border-[#E8E2D5] bg-card shadow-[0_5px_18px_rgba(7,63,50,0.045)] transition-colors hover:border-accent/75"
          >
            <ContentImage src={article.thumbnail_url} fallback={articleImages[index % articleImages.length]} />
            <div className="p-5 sm:p-6">
              {article.article_categories && (
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{article.article_categories.name}</p>
              )}
              <h3 className="text-2xl leading-tight tracking-tight">{article.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
            </div>
          </Link>
        </article>
      ))}
    </div>
    </>
  );
}
