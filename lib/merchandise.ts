import type { MerchandiseOrderItemInput } from "@/types/database";

export type ShippingDestination = { province: string; city: string; district: string; postalCode: string };
export type ShippingRate = { id: string; courier: string; service: string; cost: number; eta: string };
export type ShippingEstimate = { rates: ShippingRate[]; estimated: boolean; subtotal?: number; weight: number };

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const formatRupiah = (amount: number) => currency.format(amount);

export const maxShippingWeight = 2_147_483_647;
export const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const orderNumberPattern = /^[0-9a-f]{32}$/;

export function merchandiseLineKey(productId: string, variant: string | null) {
  return JSON.stringify([productId, variant]);
}

export function parseMerchandiseItems(raw: unknown): MerchandiseOrderItemInput[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 30) return null;
  const result = new Map<string, MerchandiseOrderItemInput>();
  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const { product_id, variant = null, qty } = row;
    if (typeof product_id !== "string" || !uuidPattern.test(product_id)
      || (variant !== null && (typeof variant !== "string" || variant.length > 100 || !variant.trim()))
      || !Number.isInteger(qty) || qty < 1 || qty > 1000) return null;
    const id = product_id.toLowerCase();
    const key = merchandiseLineKey(id, variant);
    const total = (result.get(key)?.qty ?? 0) + qty;
    if (total > 1000) return null;
    result.set(key, { product_id: id, variant, qty: total });
  }
  return [...result.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, item]) => item);
}

export function textInput(raw: unknown, max: number) {
  return typeof raw === "string" && raw.trim().length > 0 && raw.trim().length <= max ? raw.trim() : null;
}

export function parseShippingDestination(raw: unknown): ShippingDestination | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const province = textInput(value.province, 100);
  const city = textInput(value.city, 100);
  const district = textInput(value.district, 100);
  const postalCode = textInput(value.postalCode, 5);
  if ((value.postalCode && (!postalCode || !/^[1-9]\d{4}$/.test(postalCode))) || (!postalCode && !district)) return null;
  return { province: province ?? "", city: city ?? "", district: district ?? "", postalCode: postalCode ?? "" };
}
