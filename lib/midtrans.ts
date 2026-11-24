import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

interface SnapTransaction {
  transaction_details: { order_id: string; gross_amount: number };
  customer_details: { first_name: string; email: string; phone: string };
  item_details: { id: string; price: number; quantity: number; name: string }[];
  callbacks: { finish: string };
  expiry?: { start_time: string; unit: "minutes"; duration: number };
}

type MidtransStatus = {
  order_id: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
};

function getServerKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY wajib diisi.");
  return key;
}

function midtransHeaders() {
  return {
    Authorization: `Basic ${Buffer.from(`${getServerKey()}:`).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function snapOrigin() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

export async function createMidtransTransaction(transaction: SnapTransaction) {
  const origin = snapOrigin();
  const response = await fetch(`${origin}/snap/v1/transactions`, {
    method: "POST",
    headers: midtransHeaders(),
    body: JSON.stringify(transaction),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Midtrans Snap HTTP ${response.status}`);

  const data = await response.json();
  if (typeof data?.token !== "string" || !data.token
    || typeof data.redirect_url !== "string" || !URL.canParse(data.redirect_url)
    || new URL(data.redirect_url).origin !== origin) {
    throw new Error("Respons Midtrans Snap tidak valid.");
  }

  return { token: data.token, redirect_url: data.redirect_url };
}

export async function cancelMidtransSnapSession(token: string) {
  const response = await fetch(`${snapOrigin()}/snap/v1/transactions/${encodeURIComponent(token)}/cancel`, {
    method: "POST",
    headers: midtransHeaders(),
    signal: AbortSignal.timeout(4500),
  });
  const data = await response.json();
  return (response.ok && typeof data?.canceled_at === "string")
    || (Array.isArray(data?.error_messages) && data.error_messages.includes("token already canceled"));
}

export function verifyMidtransSignature(
  orderId: string, statusCode: string, grossAmount: string, signatureKey: string,
) {
  if (!/^[a-f0-9]{128}$/i.test(signatureKey)) return false;
  const expected = createHash("sha512").update(orderId + statusCode + grossAmount + getServerKey()).digest();
  return timingSafeEqual(expected, Buffer.from(signatureKey, "hex"));
}

export async function getMidtransTransactionStatus(orderId: string, transactionId?: string) {
  const origin = process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
  const response = await fetch(`${origin}/v2/${encodeURIComponent(transactionId || orderId)}/status`, {
    headers: midtransHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(4500),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Midtrans Get Status HTTP ${response.status}`);

  const data = await response.json();
  if (data?.status_code === "404") return null;
  if (data?.order_id !== orderId || typeof data.gross_amount !== "string"
    || typeof data.transaction_status !== "string") {
    throw new Error("Respons status Midtrans tidak cocok dengan pesanan.");
  }
  const status: MidtransStatus = data;
  return status;
}

export function mapMidtransStatus(status: MidtransStatus) {
  if (status.transaction_status === "settlement"
    || (status.transaction_status === "capture" && status.fraud_status === "accept")) return "PAID";
  if (["expire", "cancel", "deny"].includes(status.transaction_status)) return "EXPIRED";
  return null;
}

export function midtransAmountMatches(grossAmount: string, amount: number | null) {
  return amount !== null && /^\d+(\.0+)?$/.test(grossAmount) && Number(grossAmount) === amount;
}
