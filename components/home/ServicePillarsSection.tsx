import { ArrowRight, BookOpen, HandHeart, ShoppingBag, UsersRound } from "lucide-react";
import Link from "next/link";

const pillars = [
  { icon: BookOpen, title: "Pelatihan & Kajian", description: "Belajar kepemimpinan Islam.", href: "/program" },
  { icon: UsersRound, title: "Jejaring Ustadz", description: "Pengajar untuk kegiatan Anda.", href: "/ustadz" },
  { icon: ShoppingBag, title: "Merchandise", description: "Belanja sambil mendukung dakwah.", href: "/merchandise" },
  { icon: HandHeart, title: "Donasi Dakwah", description: "Bersama memperluas manfaat.", href: "/donasi" },
] as const;

export function ServicePillarsSection() {
  return (
    <section aria-labelledby="service-title" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-15 sm:px-6 sm:py-20 lg:px-8">
        <h2 id="service-title" className="text-center text-3xl tracking-tight text-balance sm:text-4xl">
          Ruang Bertumbuh, Jalan Memberi Manfaat
        </h2>
        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {pillars.map(({ icon: Icon, title, description, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-2xl border border-[#E8E2D5] bg-card p-5 shadow-[0_5px_18px_rgba(7,63,50,0.045)] transition-colors hover:border-accent/75 sm:p-6"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-background text-primary">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.65} />
              </span>
              <h3 className="mt-4 text-xl leading-tight">{title}</h3>
              <p className="mt-2 mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-primary">
                Selengkapnya
                <ArrowRight aria-hidden="true" className="size-4 text-[#806126] motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
