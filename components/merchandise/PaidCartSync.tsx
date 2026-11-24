"use client";

import { useEffect } from "react";

import { useCart } from "@/context/CartContext";

export function PaidCartSync({ orderId }: { orderId: string }) {
  const { consumePurchase } = useCart();
  useEffect(() => consumePurchase(orderId), [consumePurchase, orderId]);
  return null;
}
