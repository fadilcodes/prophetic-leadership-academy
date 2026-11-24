import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { orderNumberPattern, parseMerchandiseItems, parseShippingDestination, textInput } from "@/lib/merchandise";
import { getOrderTotals, releaseUnpublishedOrder } from "@/lib/merchandise-orders";
import { createMidtransTransaction } from "@/lib/midtrans";
import { getShippingRates } from "@/lib/shipping";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/database";

export const runtime = "nodejs";

function errorResponse(error: string, status = 409, code?: string) {
  return NextResponse.json({ error, code }, { status });
}

function parseCheckout(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const name = textInput(body.name, 100);
  const email = textInput(body.email, 254)?.toLowerCase();
  const phone = textInput(body.phone, 25)?.replace(/[ ()-]/g, "");
  const address = textInput(body.address, 500);
  const destination = parseShippingDestination(body.destination);
  const items = parseMerchandiseItems(body.items);
  const rateId = textInput(body.rateId, 120);
  const orderNumber = textInput(body.orderNumber, 32);
  const { subtotal, shippingCost } = body;

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !/^\+?\d{8,15}$/.test(phone)
    || !address || !destination?.province || !destination.city || !destination.district || !destination.postalCode
    || !items || !rateId || !orderNumber || !orderNumberPattern.test(orderNumber)
    || typeof subtotal !== "number" || !Number.isSafeInteger(subtotal) || subtotal < 0
    || typeof shippingCost !== "number" || !Number.isSafeInteger(shippingCost) || shippingCost < 0) return null;

  return { name, email, phone, address, destination, items, rateId, orderNumber, subtotal, shippingCost };
}

function paymentRedirect(order: Order) {
  return NextResponse.json({ redirect_url: order.midtrans_redirect_url, order_id: order.midtrans_order_id });
}

export async function POST(request: Request) {
  const input = parseCheckout(await request.json().catch(() => null));
  if (!input) return errorResponse("Periksa kembali alamat, keranjang, dan layanan kurir.", 400);
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");

  try {
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (!appUrl || !/^https?:\/\//i.test(appUrl) || !process.env.MIDTRANS_SERVER_KEY) {
      throw new Error("Konfigurasi pembayaran belum lengkap.");
    }
    const finish = new URL("/checkout/sukses", appUrl);
    const db = createAdminClient();
    const lookup = await db.from("orders").select("*").eq("order_number", input.orderNumber).maybeSingle();
    if (lookup.error) throw lookup.error;
    let order = lookup.data;

    if (order && order.checkout_fingerprint !== fingerprint) {
      return errorResponse("Data checkout berubah. Silakan buat checkout baru.", 409, "NEW_ATTEMPT");
    }

    if (!order) {
      const totals = await getOrderTotals(db, input.items);
      if ("error" in totals) return errorResponse(totals.error ?? "Keranjang tidak tersedia.", 409, "REQUOTE");
      if (totals.subtotal !== input.subtotal) return errorResponse("Harga produk berubah. Hitung ulang ongkir dan total.", 409, "REQUOTE");

      const { rates } = await getShippingRates(input.destination, totals.weight, totals.subtotal);
      const rate = rates.find((option) => option.id === input.rateId && option.cost === input.shippingCost);
      if (!rate) return errorResponse("Tarif kurir berubah atau tidak tersedia. Hitung ulang ongkir.", 409, "REQUOTE");
      if (totals.subtotal + rate.cost < 1) return errorResponse("Total pembayaran harus lebih dari nol.", 400);

      const result = await db.rpc("create_merchandise_order", {
        p_order_number: input.orderNumber,
        p_customer_name: input.name,
        p_customer_email: input.email,
        p_phone_wa: input.phone,
        p_province: input.destination.province,
        p_city: input.destination.city,
        p_district: input.destination.district,
        p_postal_code: input.destination.postalCode,
        p_full_address: input.address,
        p_courier_name: rate.courier,
        p_courier_service: rate.service,
        p_shipping_cost: rate.cost,
        p_items: input.items,
        p_expected_subtotal: totals.subtotal,
        p_weight_gram: totals.weight,
        p_checkout_fingerprint: fingerprint,
      });
      if (result.error?.message === "CHECKOUT_CONFLICT") {
        return errorResponse("Data checkout berubah. Silakan buat checkout baru.", 409, "NEW_ATTEMPT");
      }
      if (result.error?.code === "P0001" || result.error?.code === "22023") {
        return errorResponse("Harga, berat, varian, atau stok berubah. Hitung ulang ongkir.", 409, "REQUOTE");
      }
      if (result.error) throw result.error;
      order = result.data;
    }

    const { id, midtrans_order_id: orderId, payment_expires_at: expiresAt } = order;
    if (!orderId || !expiresAt) throw new Error("Referensi pembayaran pesanan tidak lengkap.");
    finish.searchParams.set("order_id", orderId);
    if (order.pay_status === "PAID") {
      return NextResponse.json({ redirect_url: finish.pathname + finish.search, order_id: orderId });
    }
    if (order.pay_status === "EXPIRED" || Date.parse(expiresAt) <= Date.now()) {
      return errorResponse("Waktu pembayaran habis. Mulai checkout baru.", 409, "NEW_ATTEMPT");
    }
    if (order.midtrans_redirect_url) return paymentRedirect(order);

    const attemptedAt = new Date().toISOString();
    const claim = await db.from("orders").update({ payment_started_at: attemptedAt })
      .eq("id", id).eq("pay_status", "PENDING").is("payment_started_at", null)
      .gt("payment_expires_at", attemptedAt).select("id").maybeSingle();
    if (claim.error) throw claim.error;
    if (!claim.data) return errorResponse("Halaman pembayaran sedang disiapkan. Coba lagi sebentar.", 409);

    try {
      const { data: items, error } = await db.from("order_items").select("id, product_name, variant, qty, unit_price")
        .eq("order_id", id).order("id");
      if (error) throw error;
      const details = items.map((item) => ({
        id: item.id,
        name: Array.from(item.variant ? `${item.product_name} (${item.variant})` : item.product_name).slice(0, 50).join(""),
        price: item.unit_price,
        quantity: item.qty,
      }));
      details.push({
        id: "shipping", name: `Ongkir ${order.courier_name} ${order.courier_service}`.slice(0, 50),
        price: order.shipping_cost, quantity: 1,
      });
      if (!items.length || details.reduce((sum, item) => sum + item.price * item.quantity, 0) !== order.total_amount) {
        throw new Error("Rincian pembayaran tidak sesuai dengan total pesanan.");
      }

      const startTime = new Date(Date.parse(expiresAt) - 30 * 60_000 + 7 * 60 * 60_000)
        .toISOString().slice(0, 19).replace("T", " ");
      const { token, redirect_url } = await createMidtransTransaction({
        transaction_details: { order_id: orderId, gross_amount: order.total_amount },
        customer_details: { first_name: order.customer_name, email: order.customer_email, phone: order.phone_wa },
        item_details: details,
        callbacks: { finish: finish.href },
        expiry: { start_time: `${startTime} +0700`, unit: "minutes", duration: 30 },
      });

      const saved = await db.from("orders").update({ midtrans_snap_token: token, midtrans_redirect_url: redirect_url })
        .eq("id", id).eq("pay_status", "PENDING").gt("payment_expires_at", new Date().toISOString())
        .is("midtrans_redirect_url", null).select("*").maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data) throw new Error("Sesi pembayaran tidak dapat disimpan.");
      return paymentRedirect(saved.data);
    } catch (error) {
      await releaseUnpublishedOrder(db, id);
      const current = await db.from("orders").select("*").eq("id", id).single();
      if (current.error) throw current.error;
      if (current.data.pay_status === "PENDING" && current.data.midtrans_redirect_url) return paymentRedirect(current.data);
      console.error("Pembukaan sesi pembayaran gagal:", error instanceof Error ? error.message : "Database");
      return errorResponse("Pembayaran belum dapat dibuka. Silakan mulai checkout baru.", 503, "NEW_ATTEMPT");
    }
  } catch (error) {
    console.error("Checkout merchandise gagal:", error instanceof Error ? error.message : "Database");
    return errorResponse("Pesanan belum dapat diproses. Silakan coba lagi.", 503);
  }
}
