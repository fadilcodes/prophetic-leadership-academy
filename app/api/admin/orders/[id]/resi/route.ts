import { NextResponse } from "next/server";

import { getAdminContext } from "@/lib/admin/auth";
import { validId } from "@/lib/admin/forms";
import { sendShippingNotification } from "@/lib/email";

export async function POST(request: Request, { params }: RouteContext<"/api/admin/orders/[id]/resi">) {
  const { db, user, isAdmin } = await getAdminContext();
  if (!isAdmin) return NextResponse.json({ error: user ? "Akses admin diperlukan." : "Silakan masuk." }, { status: user ? 403 : 401 });

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    return NextResponse.json({ error: "Gunakan format JSON." }, { status: 415 });
  }
  const body = await request.json().catch(() => null);
  const trackingNumber = typeof body?.tracking_number === "string" ? body.tracking_number.trim() : "";
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,79}$/.test(trackingNumber)) {
    return NextResponse.json({ error: "Masukkan nomor resi yang valid (maksimal 80 karakter)." }, { status: 400 });
  }

  const { data: order, error } = await db.rpc("admin_ship_order", { p_order_id: id, p_tracking_number: trackingNumber });
  if (error?.message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (error?.message === "ORDER_NOT_SHIPPABLE") {
    return NextResponse.json({ error: "Hanya pesanan lunas yang perlu dikirim atau sudah dikirim yang dapat diberi resi." }, { status: 409 });
  }
  if (error || !order.tracking_updated_at) {
    return NextResponse.json({ error: "Resi belum dapat disimpan." }, { status: 503 });
  }
  if (order.tracking_email_sent_at) return NextResponse.json({ saved: true, notified: true });

  try {
    await sendShippingNotification(order);
    const recorded = await db.from("orders").update({ tracking_email_sent_at: new Date().toISOString() })
      .eq("id", order.id).eq("tracking_updated_at", order.tracking_updated_at).is("tracking_email_sent_at", null);
    if (recorded.error) throw recorded.error;
    return NextResponse.json({ saved: true, notified: true });
  } catch {
    return NextResponse.json({
      saved: true, notified: false, error: "Resi sudah tersimpan. Kirim ulang notifikasi dari pesanan ini.",
    }, { status: 502 });
  }
}
