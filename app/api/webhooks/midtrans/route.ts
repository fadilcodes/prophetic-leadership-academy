import { NextResponse } from "next/server";

import { recordOrderPayment } from "@/lib/merchandise-orders";
import { getMidtransTransactionStatus, mapMidtransStatus, midtransAmountMatches, verifyMidtransSignature } from "@/lib/midtrans";
import { confirmProgramRegistration, recordProgramPayment } from "@/lib/program-registration";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { order_id, status_code, gross_amount, signature_key, transaction_id } = body ?? {};

  if (typeof order_id !== "string" || typeof status_code !== "string" || typeof gross_amount !== "string") {
    return NextResponse.json({ error: "Format notifikasi tidak valid." }, { status: 400 });
  }

  try {
    if (typeof signature_key !== "string" || !verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
      return NextResponse.json({ error: "Tanda tangan Midtrans tidak valid." }, { status: 401 });
    }

    if (order_id.startsWith("PROG-")) {
      const db = createAdminClient();
      const { data: registration, error } = await db.from("program_registrations")
        .select("*").eq("midtrans_order_id", order_id).maybeSingle();
      if (error) throw error;
      if (!registration) return NextResponse.json({ received: true });
      if (!midtransAmountMatches(gross_amount, registration.payment_amount)) {
        return NextResponse.json({ error: "Nominal notifikasi tidak cocok." }, { status: 409 });
      }

      if (registration.pay_status === "PAID") {
        await confirmProgramRegistration(db, registration);
        return NextResponse.json({ received: true });
      }

      const verified = await getMidtransTransactionStatus(
        order_id, typeof transaction_id === "string" ? transaction_id : undefined,
      );
      if (!verified) return NextResponse.json({ error: "Status transaksi belum tersedia." }, { status: 503 });
      if (!midtransAmountMatches(verified.gross_amount, registration.payment_amount)) {
        return NextResponse.json({ error: "Nominal transaksi tidak cocok." }, { status: 409 });
      }

      const status = mapMidtransStatus(verified);
      if (status) await recordProgramPayment(db, registration, status, verified.gross_amount);
    } else if (order_id.startsWith("ORD-")) {
      const db = createAdminClient();
      const { data: order, error } = await db.from("orders").select("*").eq("midtrans_order_id", order_id).maybeSingle();
      if (error) throw error;
      if (!order) return NextResponse.json({ received: true });
      if (!midtransAmountMatches(gross_amount, order.total_amount)) {
        return NextResponse.json({ error: "Nominal notifikasi tidak cocok." }, { status: 409 });
      }

      if (order.pay_status === "PAID") {
        await recordOrderPayment(db, order, "PAID");
        return NextResponse.json({ received: true });
      }
      if (order.pay_status === "EXPIRED") return NextResponse.json({ received: true });

      const verified = await getMidtransTransactionStatus(
        order_id, typeof transaction_id === "string" ? transaction_id : undefined,
      );
      if (!verified) return NextResponse.json({ error: "Status transaksi belum tersedia." }, { status: 503 });
      if (!midtransAmountMatches(verified.gross_amount, order.total_amount)) {
        return NextResponse.json({ error: "Nominal transaksi tidak cocok." }, { status: 409 });
      }

      const status = mapMidtransStatus(verified);
      if (status) await recordOrderPayment(db, order, status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Midtrans gagal diproses:", error instanceof Error ? error.message : "Database");
    return NextResponse.json({ error: "Notifikasi belum dapat diproses." }, { status: 503 });
  }
}
