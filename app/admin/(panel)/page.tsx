import { CalendarDays, PackageCheck, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin/auth";
import { formatRupiah } from "@/lib/merchandise";

export default async function AdminDashboard() {
  const db = await requireAdmin();
  const { data, error } = await db.rpc("admin_dashboard_metrics").single();
  if (error) throw new Error("Ringkasan dashboard belum dapat dimuat.");

  const metrics = [
    { label: "Pemasukan program lunas", value: formatRupiah(data.program_revenue), icon: CalendarDays, href: "/admin/program" },
    { label: "Penjualan merchandise lunas", value: formatRupiah(data.merchandise_revenue), icon: ShoppingBag, href: "/admin/pesanan?bayar=PAID" },
    { label: "Pesanan perlu dikirim", value: data.processing_orders, icon: PackageCheck, href: "/admin/pesanan?kirim=PROCESSING" },
    { label: "Total pendaftar program", value: data.registered_participants, icon: Users, href: "/admin/program" },
  ];

  return (
    <>
      <h1 className="text-4xl">Dashboard</h1>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="grid gap-3 rounded-xl border bg-card p-5 hover:border-accent">
            <span className="grid size-10 place-items-center rounded-lg bg-accent/30 text-primary"><Icon aria-hidden="true" className="size-5" /></span>
            <span className="break-words text-2xl font-bold text-primary tabular-nums">{value}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
