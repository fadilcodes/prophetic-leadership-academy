import "server-only";

import { sendOrderConfirmation } from "@/lib/email";
import { maxShippingWeight } from "@/lib/merchandise";
import { cancelMidtransSnapSession, getMidtransTransactionStatus, mapMidtransStatus, midtransAmountMatches } from "@/lib/midtrans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MerchandiseOrderItemInput, Order } from "@/types/database";

type OrderDatabase = ReturnType<typeof createAdminClient>;

export async function getOrderTotals(db: OrderDatabase, items: MerchandiseOrderItemInput[]) {
  const ids = [...new Set(items.map((item) => item.product_id))];
  const { data, error } = await db.from("products").select("id, name, price, weight_gram, stock, variants")
    .in("id", ids).eq("is_active", true);
  if (error) throw error;
  const products = new Map(data.map((product) => [product.id, product]));
  const reserved = new Map<string, number>();
  let subtotal = 0;
  let weight = 0;

  for (const item of items) {
    const product = products.get(item.product_id);
    if (!product) return { error: "Salah satu produk sudah tidak tersedia." } as const;
    const qty = (reserved.get(item.product_id) ?? 0) + item.qty;
    if (qty > product.stock) return { error: `Stok ${product.name} tersisa ${product.stock}.` } as const;
    const variant = item.variant ?? null;
    if (product.variants.length ? variant === null || !product.variants.includes(variant) : variant !== null) {
      return { error: `Varian ${product.name} sudah tidak tersedia.` } as const;
    }
    reserved.set(item.product_id, qty);
    subtotal += item.qty * product.price;
    weight += item.qty * product.weight_gram;
  }

  if (weight > maxShippingWeight) return { error: "Berat kiriman melebihi batas perhitungan. Kurangi jumlah item." } as const;
  if (subtotal > 2_000_000_000) return { error: "Total belanja melebihi batas transaksi." } as const;
  return { subtotal, weight } as const;
}

export async function recordOrderPayment(db: OrderDatabase, order: Order, status: "PAID" | "EXPIRED") {
  if (order.pay_status === "PAID") {
    await sendOrderConfirmation(db, order);
    return;
  }
  if (order.pay_status !== "PENDING") return;

  if (status === "EXPIRED") {
    const { error } = await db.rpc("restore_order_stock", { p_order_id: order.id });
    if (error) throw error;
    return;
  }

  const { data, error } = await db.from("orders")
    .update({ pay_status: "PAID", fulfillment_status: "PROCESSING" })
    .eq("id", order.id).eq("pay_status", "PENDING").select("*").maybeSingle();
  if (error) throw error;
  if (data) await sendOrderConfirmation(db, data);
}

export async function releaseUnpublishedOrder(db: OrderDatabase, orderId: string) {
  const { error } = await db.rpc("release_unpublished_order", { p_order_id: orderId });
  if (error) throw error;
}

export async function reconcileMerchandiseStock() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.MIDTRANS_SERVER_KEY) return;
  try {
    const db = createAdminClient();
    const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data, error } = await db.from("orders").select("*").eq("pay_status", "PENDING")
      .lt("payment_expires_at", cutoff).order("payment_expires_at").limit(6);
    if (error) throw error;
    const results = await Promise.allSettled(data.map(async (order) => {
      if (!order.midtrans_redirect_url) {
        await releaseUnpublishedOrder(db, order.id);
        return;
      }
      if (!order.midtrans_order_id) return;
      const verified = await getMidtransTransactionStatus(order.midtrans_order_id);
      if (verified && midtransAmountMatches(verified.gross_amount, order.total_amount)) {
        const status = mapMidtransStatus(verified);
        if (status) await recordOrderPayment(db, order, status);
      } else if (!verified && order.midtrans_snap_token && await cancelMidtransSnapSession(order.midtrans_snap_token)) {
        await recordOrderPayment(db, order, "EXPIRED");
      }
    }));
    if (results.some((result) => result.status === "rejected")) console.error("Sebagian stok belum dapat disinkronkan.");
  } catch {
    console.error("Sinkronisasi stok merchandise belum dapat dijalankan.");
  }
}
