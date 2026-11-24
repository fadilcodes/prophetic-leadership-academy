import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { getProductImages } from "@/components/merchandise/ProductImage";
import { ProductPurchase } from "@/components/merchandise/ProductPurchase";
import { reconcileMerchandiseStock } from "@/lib/merchandise-orders";
import { getPublicProduct } from "@/lib/public-content";

export default async function MerchandiseDetailPage({ params }: PageProps<"/merchandise/[slug]">) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  after(reconcileMerchandiseStock);

  const gallery = getProductImages(product.slug, product.images_url);
  return (
    <article>
      <Link href="/merchandise" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua merchandise
      </Link>
      <ProductPurchase key={product.id} product={product} {...gallery} />
    </article>
  );
}
