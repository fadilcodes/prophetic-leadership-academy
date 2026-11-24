import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-primary text-primary-foreground"
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-accent">
        <defs>
          <pattern id="hero-geometri" width="72" height="72" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="0.9">
              <path d="M36 3 45 19 63 9 53 27 69 36 53 45 63 63 45 53 36 69 27 53 9 63 19 45 3 36 19 27 9 9 27 19Z" />
              <path d="M0 0 72 72M72 0 0 72M36 0V3M0 36H3M69 36H72M36 69V72" />
            </g>
          </pattern>
          <radialGradient id="hero-ornamen-pudar">
            <stop offset="0" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-ornamen-sudut">
            <ellipse cx="0%" cy="0%" rx="42%" ry="77%" fill="url(#hero-ornamen-pudar)" />
            <ellipse cx="100%" cy="100%" rx="43%" ry="80%" fill="url(#hero-ornamen-pudar)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-geometri)" mask="url(#hero-ornamen-sudut)" opacity="0.14" />
      </svg>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-13 pb-14 sm:px-6 sm:pt-18 sm:pb-18 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="min-w-0 lg:col-span-7">
          <p className="flex items-center gap-3 text-xs leading-relaxed font-bold tracking-[0.19em] text-accent uppercase sm:text-sm">
            <span aria-hidden="true" className="h-px w-7 shrink-0 bg-accent" />
            Prophetic Leadership Academy
          </p>
          <h1
            id="hero-title"
            className="mt-5 max-w-[16ch] text-[clamp(2.35rem,6.1vw,4.6rem)] leading-[1.07] font-semibold tracking-tight text-white sm:max-w-none"
          >
            Tangguh dalam Tantangan.{" "}
            <span className="block">Teguh dalam Nilai.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-[1.8] text-primary-foreground/90 sm:text-lg">
            Menumbuhkan insan berakhlak mulia, adaptif, dan berintegritas melalui keteladanan Rasulullah ﷺ.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/program"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-bold text-accent-foreground outline-accent transition-colors hover:bg-[#D8B870] sm:px-5"
            >
              Jelajahi Program
            </Link>
            <Link
              href="/tentang-pla"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-accent px-4 py-3 text-sm font-bold text-primary-foreground outline-accent transition-colors hover:bg-accent/15 sm:px-5"
            >
              Kenali PLA
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[27rem] px-2 lg:col-span-5 lg:justify-self-end">
          <div className="relative aspect-[5/5.25] rounded-t-full rounded-b-xl border border-accent/70 p-1.5 sm:p-2">
            <div className="relative size-full overflow-hidden rounded-t-full rounded-b-lg bg-[#224F41]">
              <Image
                src="/images/home/diskusi-pla.webp"
                alt="Ilustrasi fasilitator dan peserta berdiskusi di ruang belajar"
                fill
                preload
                sizes="(max-width: 479px) calc(100vw - 60px), 410px"
                className="object-cover object-[center_53%]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
