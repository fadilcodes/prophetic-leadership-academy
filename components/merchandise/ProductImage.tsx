import { Package } from "lucide-react";
import Image from "next/image";

import { getPublicImageUrl } from "@/lib/public-url";

const illustratedProducts = new Set(["jurnal-amanah-pla", "totebag-musyawarah", "kartu-diskusi-akhlak"]);

export function getProductImages(slug: string, images: string[]) {
  const actual = images.map(getPublicImageUrl).filter((image): image is string => image !== null);
  const illustrated = actual.length === 0 && illustratedProducts.has(slug);
  return { images: illustrated ? [`/images/merchandise/${slug}.webp`] : actual, illustrated };
}

export function ProductImage({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  if (!src) return (
    <div className="absolute inset-0 grid place-items-center bg-secondary text-primary/55">
      <Package className="size-9" aria-hidden="true" />
    </div>
  );

  return <Image src={src} alt={alt} sizes={sizes} fill unoptimized={!src.startsWith("/")} className="object-cover" />;
}
