import { CircleCheck, Clock3, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { PaidCartSync } from "@/components/merchandise/PaidCartSync";
import { formatRupiah, orderNumberPattern } from "@/lib/merchandise";
import { reconcileMerchandiseStock } from "@/lib/merchandise-orders";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Status Pesanan", robots: { index: false, follow: false } };

export default async function OrderStatusPage({ searchParams }: PageProps<"/checkout/sukses">) {
  const { order_id: orderId } = await searchParams;
  if (typeof orderId !== "string" || !orderId.startsWith("ORD-") || !orderNumberPattern.test(orderId.slice(4))) notFound();

  const { data: order, error } = await createAdminClient().from("orders")
    .select("order_number, pay_status, total_amount, confirmation_sent_at").eq("midtrans_order_id", orderId).maybeSingle();
  if (error) throw error;
  if (!order) notFound();

  const paid = order.pay_status === "PAID";
  const pending = order.pay_status === "PENDING";
  if (pending) after(reconcileMerchandiseStock);
  const Icon = paid ? CircleCheck : pending ? Clock3 : Info;
  const title = paid ? "Pembayaran diterima" : pending ? "Menunggu konfirmasi pembayaran" : "Pembayaran tidak selesai";
  const message = paid
    ? order.confirmation_sent_at ? "Pesanan sedang diproses. Rincian pesanan telah dikirim melalui email." : "Pesanan sedang diproses."
    : pending ? "Status akan diperbarui setelah konfirmasi dari Midtrans." : "Transaksi telah berakhir. Keranjang Anda dapat digunakan kembali.";

  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-card p-6 text-center sm:p-10">
      {paid && <PaidCartSync orderId={orderId} />}
      <Icon className="mx-auto size-10 text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">{message}</p>
      <dl className="mt-5 space-y-3 rounded-xl bg-background p-4 text-left text-sm">
        <div><dt className="font-bold text-primary">Nomor pesanan</dt><dd className="mt-1 break-all">{order.order_number}</dd></div>
        <div><dt className="font-bold text-primary">Total</dt><dd className="mt-1">{formatRupiah(order.total_amount)}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {pending && <a href={`?order_id=${orderId}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground">Perbarui status</a>}
        <Link href={order.pay_status === "EXPIRED" ? "/checkout" : "/merchandise"}
          className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-bold text-primary">
          {order.pay_status === "EXPIRED" ? "Kembali ke checkout" : "Lihat merchandise"}
        </Link>
      </div>
    </section>
  );
}
