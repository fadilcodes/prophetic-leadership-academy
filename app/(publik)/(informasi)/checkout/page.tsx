import type { Metadata } from "next";

import { CheckoutForm } from "@/components/merchandise/CheckoutForm";

export const metadata: Metadata = { title: "Checkout Merchandise" };

export default function CheckoutPage() {
  return <CheckoutForm />;
}
