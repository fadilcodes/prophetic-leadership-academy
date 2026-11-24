import { Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";

import { ArticleShare } from "@/components/edukasi/ArticleShare";
import { ArticleCards } from "@/components/home/HomeBottomSections";
import { getPublicArticle, getRelatedArticles } from "@/lib/public-content";
import { getPublicImageUrl } from "@/lib/public-url";

const categoryImages = new Map([
  ["sirah-dan-akhlak", "/images/home/sirah.webp"],
  ["dakwah-komunitas", "/images/home/komunitas.webp"],
]);

function imageFor(article: { thumbnail_url: string | null; article_categories: { slug: string } }) {
  return getPublicImageUrl(article.thumbnail_url) ?? categoryImages.get(article.article_categories.slug) ?? "/images/home/amanah.webp";
}

function absoluteUrl(path: string) {
  if (path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base || !/^https?:\/\//.test(base) || !URL.canParse(base)) return undefined;
  return new URL(path, base).href;
}

export async function generateMetadata({ params }: PageProps<"/edukasi/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicArticle(slug);
  if (!result) notFound();

  const { article } = result;
  const url = absoluteUrl(`/edukasi/${encodeURIComponent(article.slug)}`);
  const image = absoluteUrl(imageFor(article));

  return {
    title: article.title,
    description: article.excerpt,
    alternates: url ? { canonical: url } : undefined,
    robots: result.isSample ? { index: false } : undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      locale: "id_ID",
      url,
      publishedTime: article.published_at ?? undefined,
      images: image ? [{ url: image, alt: article.title }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: article.title, description: article.excerpt, images: image },
  };
}

const publishDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" });

export default async function ArticlePage({ params }: PageProps<"/edukasi/[slug]">) {
  const { slug } = await params;
  const result = await getPublicArticle(slug);
  if (!result) notFound();

  const { article, isSample } = result;
  const related = await getRelatedArticles(article, isSample);
  const image = imageFor(article);
  const path = `/edukasi/${encodeURIComponent(article.slug)}`;
  const minutes = Math.max(1, Math.ceil(article.content.trim().split(/\s+/).length / 200));

  return (
    <>
      <article className="mx-auto max-w-4xl">
        <Link href="/edukasi" className="inline-flex min-h-11 items-center text-sm font-bold text-primary underline-offset-4 hover:underline">
          Kembali ke artikel
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link href={`/edukasi?kategori=${encodeURIComponent(article.article_categories.slug)}`} className="inline-flex min-h-11 items-center rounded-full bg-secondary px-4 font-bold text-primary">
            {article.article_categories.name}
          </Link>
          {article.published_at && <time dateTime={article.published_at}>{publishDate.format(new Date(article.published_at))}</time>}
          <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="size-4" /> {minutes} menit baca</span>
        </div>
        <h1 className="mt-4 text-4xl leading-tight tracking-tight sm:text-5xl">{article.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
        {isSample && <p className="mt-3 text-sm font-medium text-muted-foreground">Contoh bacaan dari PLA.</p>}
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-secondary">
          <Image src={image} alt="" fill sizes="(max-width: 960px) calc(100vw - 32px), 896px" unoptimized={!image.startsWith("/")} className="object-cover" />
        </div>
        <div className="prose mt-8 max-w-none wrap-break-word text-foreground prose-headings:font-serif prose-headings:text-primary prose-p:whitespace-pre-line prose-a:text-primary">
          <Markdown skipHtml components={{ h1: "h2" }}>{article.content}</Markdown>
        </div>
        <ArticleShare title={article.title} path={path} canonical={absoluteUrl(path)} />
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-articles" className="mt-14 border-t pt-10">
          <h2 id="related-articles" className="text-center text-3xl tracking-tight">Artikel terkait</h2>
          <ArticleCards items={related} isSample={false} />
        </section>
      )}
    </>
  );
}
