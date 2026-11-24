import { Menu } from "lucide-react";
import Link from "next/link";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { donationLink, primaryNavigation } from "./navigation";

const donationClass = "min-h-11 items-center justify-center rounded-md border border-accent px-4 text-sm font-bold text-primary transition-colors hover:bg-accent/10";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Prophetic Leadership Academy, beranda"
          className="inline-flex shrink-0 items-center gap-2 rounded-md text-primary"
        >
          <svg
            aria-hidden="true"
            className="size-8 shrink-0"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 28V16C5 10.5 10 8.5 16 3c6 5.5 11 7.5 11 13v12H5Z" />
            <path d="M10 28V17c0-3 2.5-4.5 6-7.5 3.5 3 6 4.5 6 7.5v11" />
          </svg>
          <span className="text-2xl leading-none font-bold tracking-tight">PLA</span>
          <span aria-hidden="true" className="mx-0.5 h-8 w-px bg-primary/25" />
          <span className="text-xs leading-tight font-semibold">
            Prophetic<br />
            Leadership Academy
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-5 lg:flex xl:gap-8">
          {primaryNavigation.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-primary hover:underline hover:underline-offset-4"
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link href={donationLink.href} className={`${donationClass} hidden shrink-0 lg:inline-flex`}>
          {donationLink.label}
        </Link>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-md border text-primary hover:bg-accent/10"
              >
                <Menu aria-hidden="true" className="size-5" />
                <span className="sr-only">Buka menu</span>
              </button>
            </SheetTrigger>
            <SheetContent aria-describedby={undefined}>
              <SheetTitle className="pr-12 font-serif text-2xl font-bold text-primary">
                Menu PLA
              </SheetTitle>
              <nav aria-label="Navigasi utama" className="mt-6 grid gap-1">
                {primaryNavigation.map(({ label, href }) => (
                  <SheetClose key={href} asChild>
                    <Link
                      href={href}
                      className="flex min-h-11 items-center rounded-md px-3 font-semibold text-primary hover:bg-accent/10"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link href={donationLink.href} className={`${donationClass} mt-4 flex`}>
                    {donationLink.label}
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
