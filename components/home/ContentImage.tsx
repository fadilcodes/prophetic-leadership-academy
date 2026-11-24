import Image from "next/image";

import { getPublicImageUrl } from "@/lib/public-url";

interface ContentImageProps {
  src: string | null;
  fallback: string;
}

export function ContentImage({ src, fallback }: ContentImageProps) {
  const image = getPublicImageUrl(src) ?? fallback;

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
      <Image
        src={image}
        alt=""
        fill
        unoptimized={!image.startsWith("/")}
        sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) 50vw, 400px"
        className="object-cover"
      />
    </div>
  );
}
