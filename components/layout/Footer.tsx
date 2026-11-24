import Link from "next/link";

import { donationLink, primaryNavigation } from "./navigation";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <section>
            <h2 className="text-2xl font-bold text-primary-foreground">
              Prophetic Leadership Academy
            </h2>
            <p className="mt-3 max-w-sm leading-relaxed">
              Akademi yang mengembangkan kepemimpinan profetik melalui pendidikan
              dan dakwah yang berpijak pada nilai-nilai Islam.
            </p>
          </section>

          <nav aria-labelledby="navigasi-footer">
            <h2 id="navigasi-footer" className="text-base font-bold text-primary-foreground">
              Navigasi cepat
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {[...primaryNavigation, donationLink].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-11 items-center rounded-sm text-sm outline-accent hover:underline hover:underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section>
            <h2 className="text-base font-bold text-primary-foreground">
              Kontak resmi
            </h2>
            <Link href="/kontak" className="mt-3 inline-flex min-h-11 items-center rounded-sm text-sm outline-accent hover:underline hover:underline-offset-4">
              Kontak PLA
            </Link>
          </section>
        </div>

        <p className="mt-9 border-t border-primary-foreground/20 py-5 text-sm">
          © {new Date().getFullYear()} Prophetic Leadership Academy. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
