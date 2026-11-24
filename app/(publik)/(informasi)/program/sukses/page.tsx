import type { Metadata } from "next";
import { CircleCheck, Clock3, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { registrationIdPattern } from "@/lib/program-registration";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Status Pendaftaran Program",
  robots: { index: false, follow: false },
};

export default async function ProgramSuccessPage({ searchParams }: PageProps<"/program/sukses">) {
  const params = await searchParams;
  const orderId = typeof params.order_id === "string" && params.order_id.startsWith("PROG-")
    && registrationIdPattern.test(params.order_id.slice(5)) ? params.order_id : null;
  const id = typeof params.id === "string" && registrationIdPattern.test(params.id) ? params.id : null;
  if (!orderId && !id) notFound();

  const db = createAdminClient();
  const query = db.from("program_registrations")
    .select("pay_status, confirmation_sent_at, programs(title, slug)");
  const { data, error } = await (orderId ? query.eq("midtrans_order_id", orderId) : query.eq("id", id ?? "")).maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  const pending = data.pay_status === "PENDING";
  const expired = data.pay_status === "EXPIRED";
  const StatusIcon = pending ? Clock3 : expired ? Info : CircleCheck;
  const title = pending ? "Menunggu konfirmasi pembayaran"
    : expired ? "Pembayaran tidak selesai" : "Pendaftaran terkonfirmasi";
  const message = pending ? "Status akan diperbarui setelah konfirmasi dari Midtrans."
    : expired ? "Transaksi berakhir tanpa pembayaran. Anda dapat kembali ke halaman program untuk melihat ketersediaan."
    : data.confirmation_sent_at ? "Tiket dan detail akses telah dikirim ke email pendaftaran."
    : "Tiket dan detail akses akan dikirim ke email pendaftaran.";

  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-card p-6 text-center sm:p-10">
      <StatusIcon aria-hidden="true" className="mx-auto size-10 text-primary" />
      <h1 className="mt-4 text-3xl tracking-tight sm:text-4xl">{title}</h1>
      {data.programs && <p className="mt-3 font-bold text-primary">{data.programs.title}</p>}
      <p className="mt-3 leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {pending && (
          <a href={orderId ? `?order_id=${orderId}` : `?id=${id}`}
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground">
            Perbarui status
          </a>
        )}
        <Link href={expired && data.programs ? `/program/${encodeURIComponent(data.programs.slug)}` : "/program"}
          className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-bold text-primary">
          {expired && data.programs ? "Kembali ke program" : "Lihat katalog program"}
        </Link>
      </div>
    </section>
  );
}
