"use client";

import { BookOpen, Boxes, CalendarDays, LayoutDashboard, Settings, Truck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/artikel", "Artikel", BookOpen],
  ["/admin/program", "Program & Pendaftar", CalendarDays],
  ["/admin/ustadz", "Jejaring Ustadz", Users],
  ["/admin/produk", "Produk Merchandise", Boxes],
  ["/admin/pesanan", "Pesanan & Pengiriman", Truck],
  ["/admin/pengaturan", "Pengaturan Website", Settings],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi admin" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
      {links.map(([href, label, Icon]) => {
        const active = pathname === href || href !== "/admin" && pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold focus-visible:outline-accent ${active ? "bg-accent text-accent-foreground" : "text-primary-foreground hover:bg-white/10"}`}>
            <Icon aria-hidden="true" className="size-4 shrink-0" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
