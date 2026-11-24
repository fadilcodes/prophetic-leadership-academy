import type { OrderFulfillmentStatus, OrderPayStatus, RegistrationPayStatus } from "@/types/database";

export const registrationStatuses = ["PENDING", "CONFIRMED", "PAID", "EXPIRED"] as const satisfies readonly RegistrationPayStatus[];
export const orderPaymentStatuses = ["PENDING", "PAID", "EXPIRED"] as const satisfies readonly OrderPayStatus[];
export const fulfillmentStatuses = ["UNFULFILLED", "PROCESSING", "SHIPPED", "COMPLETED"] as const satisfies readonly OrderFulfillmentStatus[];

export const statusLabels = {
  PENDING: "Menunggu pembayaran",
  CONFIRMED: "Terkonfirmasi",
  PAID: "Lunas",
  EXPIRED: "Kedaluwarsa",
  UNFULFILLED: "Belum diproses",
  PROCESSING: "Perlu dikirim",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
};

export function statusOptions(statuses: readonly (keyof typeof statusLabels)[]) {
  return [{ value: "", label: "Semua" }, ...statuses.map((value) => ({ value, label: statusLabels[value] }))];
}

export function midtransOrderFilter(value: string | string[] | undefined) {
  const orderId = typeof value === "string" ? value.trim() : "";
  return /^[a-z0-9_.~-]{1,50}$/i.test(orderId) ? orderId : undefined;
}
