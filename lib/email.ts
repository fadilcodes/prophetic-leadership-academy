import "server-only";

import { formatRupiah } from "@/lib/merchandise";
import { formatProgramSchedule } from "@/lib/public-content";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Order, Program, ProgramRegistration } from "@/types/database";

type ProgramEmailDetails = Pick<Program, "id" | "title" | "schedule_date" | "location_or_platform">;

export async function sendProgramConfirmation(
  db: ReturnType<typeof createAdminClient>,
  registration: ProgramRegistration,
  program: ProgramEmailDetails,
) {
  if (registration.confirmation_sent_at) return;

  const { data: access, error: accessError } = await db.from("program_access_details")
    .select("details").eq("program_id", program.id).maybeSingle();
  if (accessError) throw accessError;

  const message = [
    `Assalamu’alaikum, ${registration.participant_name}.`,
    `Pendaftaran Anda untuk ${program.title} sudah dikonfirmasi.`,
    `Nomor tiket: ${registration.id}\nJadwal: ${formatProgramSchedule(program.schedule_date)}\nLokasi/platform: ${program.location_or_platform}`,
    access?.details ? `Detail akses\n${access.details}` : null,
    "Prophetic Leadership Academy",
  ].filter(Boolean).join("\n\n");

  await sendEmail(registration.email, `Konfirmasi program PLA — ${program.title}`, message, `program-confirmation/${registration.id}`);

  const { error } = await db.from("program_registrations")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", registration.id).is("confirmation_sent_at", null);
  if (error) throw error;
}

async function sendEmail(to: string, subject: string, text: string, idempotencyKey: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Konfigurasi Resend belum lengkap.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
    signal: AbortSignal.timeout(4500),
  });
  if (!response.ok) throw new Error(`Resend HTTP ${response.status}`);
}

export async function sendOrderConfirmation(db: ReturnType<typeof createAdminClient>, order: Order) {
  if (order.confirmation_sent_at) return;
  const { data: items, error } = await db.from("order_items").select("product_name, variant, qty, unit_price")
    .eq("order_id", order.id).order("id");
  if (error) throw error;

  const lines = items.map((item) =>
    `• ${item.product_name}${item.variant ? ` (${item.variant})` : ""} × ${item.qty} — ${formatRupiah(item.unit_price * item.qty)}`);
  const message = [
    `Assalamu’alaikum, ${order.customer_name}.`,
    `Pembayaran pesanan ${order.order_number} telah diterima. Pesanan sedang diproses.`,
    lines.join("\n"),
    `Subtotal ${formatRupiah(order.subtotal)}\nOngkir (${order.courier_name} ${order.courier_service}) ${formatRupiah(order.shipping_cost)}\nTotal dibayar ${formatRupiah(order.total_amount)}`,
    `Alamat pengiriman\n${order.full_address}\n${order.district}, ${order.city}, ${order.province} ${order.postal_code}`,
    "Prophetic Leadership Academy",
  ].join("\n\n");

  await sendEmail(order.customer_email, "Pembayaran merchandise PLA diterima", message, `order-confirmation/${order.id}`);
  const { error: saveError } = await db.from("orders").update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", order.id).is("confirmation_sent_at", null);
  if (saveError) throw saveError;
}

export async function sendShippingNotification(order: Order) {
  const body = [
    `Assalamu’alaikum, ${order.customer_name}.`,
    `Pesanan ${order.order_number} sudah dikirim.`,
    `Kurir: ${order.courier_name} ${order.courier_service}\nNomor resi: ${order.tracking_number}`,
    "Prophetic Leadership Academy",
  ].join("\n\n");
  await sendEmail(order.customer_email, "Pesanan merchandise PLA sudah dikirim", body,
    `order-shipping/${order.id}/${order.tracking_updated_at}`);
}
