import type { ReactNode } from "react";

import { CartProvider } from "@/context/CartContext";

export default function InformationLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <CartProvider>{children}</CartProvider>
    </div>
  );
}
