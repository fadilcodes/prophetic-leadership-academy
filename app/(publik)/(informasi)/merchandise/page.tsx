import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";

import { CartDrawer } from "@/components/merchandise/CartDrawer";
import { getProductImages, ProductImage } from "@/components/merchandise/ProductImage";
import { formatRupiah } from "@/lib/merchandise";
import { reconcileMerchandiseStock } from "@/lib/merchandise-orders";
import { getPublicProducts } from "@/lib/public-content";

export const metadata: Metadata = { title: "Merchandise" };
export const dynamic = "force-dynamic";

export default async function MerchandisePage() {
  const { items, unavailable } = await getPublicProducts();
  if (!unavailable) after(reconcileMerchandiseStock);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5 border-b pb-7">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Merchandise PLA</h1>
        <CartDrawer />
      </div>

      {items.length === 0 && (
        <p className="mt-8 rounded-xl border bg-card p-5 text-muted-foreground">
          {unavailable ? "Katalog belum dapat dimuat. Silakan coba lagi." : "Belum ada produk yang tersedia."}
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => {
          const { images, illustrated } = getProductImages(product.slug, product.images_url);
          return (
            <article key={product.id} className="min-w-0">
              <Link href={`/merchandise/${encodeURIComponent(product.slug)}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-accent">
                <div className="relative aspect-[5/4] overflow-hidden bg-secondary">
                  <ProductImage src={images[0] ?? null} alt="" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 420px" />
                  {illustrated && <span className="absolute bottom-3 left-3 rounded bg-background px-2 py-1 text-xs text-primary">Ilustrasi produk</span>}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <span className="self-start rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">
                    {product.stock > 0 ? "Tersedia" : "Stok habis"}
                  </span>
                  <h2 className="text-2xl leading-tight">{product.name}</h2>
                  <div className="mt-auto flex items-center justify-between gap-3 font-bold text-primary">
                    <span>{formatRupiah(product.price)}</span>
                    <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
