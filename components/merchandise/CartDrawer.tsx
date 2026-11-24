"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/merchandise/ProductImage";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { formatRupiah, merchandiseLineKey } from "@/lib/merchandise";

export function CartDrawer({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const { items, setQuantity } = useCart();
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const qty = items.reduce((sum, item) => sum + item.qty, 0);
  const quantityButton = "grid size-11 place-items-center rounded-lg enabled:hover:bg-secondary disabled:opacity-40";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-card px-4 text-sm font-bold text-primary hover:bg-secondary">
        <ShoppingBag aria-hidden="true" className="size-4" /> Keranjang{qty > 0 ? ` (${qty})` : ""}
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="w-[min(26rem,94vw)]">
        <SheetTitle className="pr-12 text-2xl text-primary">Keranjang belanja</SheetTitle>
        {items.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">Keranjang Anda masih kosong.</p>
        ) : (
          <>
            <ul className="mt-5 divide-y">
              {items.map((item) => {
                const productQty = items.filter((line) => line.productId === item.productId).reduce((sum, line) => sum + line.qty, 0);
                return (
                  <li key={merchandiseLineKey(item.productId, item.variant)} className="flex gap-3 py-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                      <ProductImage src={item.image} alt="" sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-primary">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.variant}</p>
                      <p className="mt-1 text-sm">{formatRupiah(item.price * item.qty)}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <button type="button" className={quantityButton} disabled={item.qty <= 1} aria-label={`Kurangi jumlah ${item.name}`}
                          onClick={() => setQuantity(item.productId, item.variant, item.qty - 1)}><Minus size={16} aria-hidden="true" /></button>
                        <span className="min-w-6 text-center text-sm" aria-live="polite">{item.qty}</span>
                        <button type="button" className={quantityButton} disabled={productQty >= item.stock || item.qty >= 1000} aria-label={`Tambah jumlah ${item.name}`}
                          onClick={() => setQuantity(item.productId, item.variant, item.qty + 1)}><Plus size={16} aria-hidden="true" /></button>
                        <button type="button" className={quantityButton} aria-label={`Hapus ${item.name} dari keranjang`}
                          onClick={() => setQuantity(item.productId, item.variant, 0)}><Trash2 size={16} aria-hidden="true" /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto border-t pt-5">
              <div className="flex justify-between gap-4 font-bold text-primary"><span>Subtotal</span><span>{formatRupiah(total)}</span></div>
              <SheetClose asChild>
                <Link href="/checkout" className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 font-bold text-accent-foreground hover:bg-accent-hover">
                  Lanjut ke checkout
                </Link>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
