"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CartDrawer } from "@/components/merchandise/CartDrawer";
import { ProductImage } from "@/components/merchandise/ProductImage";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/merchandise";
import type { Product } from "@/types/database";

type PurchaseProduct = Pick<Product, "id" | "name" | "price" | "weight_gram" | "stock" | "variants" | "description" | "material">;

export function ProductPurchase({ product, images, illustrated }: {
  product: PurchaseProduct; images: string[]; illustrated: boolean;
}) {
  const cart = useCart();
  const router = useRouter();
  const [photo, setPhoto] = useState(0);
  const [variant, setVariant] = useState<string | null>(product.variants[0] ?? null);
  const [requestedQty, setRequestedQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState("");

  const cartQty = cart.items.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.qty, 0);
  const available = Math.max(0, Math.min(1000, product.stock - cartQty));
  const qty = Math.min(requestedQty, available);
  const quantityButton = "grid size-11 place-items-center rounded-md text-primary enabled:hover:bg-secondary disabled:opacity-40";
  const addDisabled = !cart.ready || qty < 1;

  function purchase(checkout: boolean) {
    setError("");
    if (!cart.addItem({
      productId: product.id, name: product.name, price: product.price, weight_gram: product.weight_gram,
      variant, stock: product.stock, qty, image: images[0] ?? null,
    })) {
      setError("Item belum dapat ditambahkan. Periksa jumlah dan isi keranjang.");
      return;
    }

    if (checkout) router.push("/checkout");
    else setCartOpen(true);
  }

  return (
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-14">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-secondary">
          <ProductImage src={images[photo] ?? null} alt={illustrated ? `Ilustrasi ${product.name}` : `${product.name}, foto ${photo + 1}`}
            sizes="(max-width: 1023px) 100vw, 620px" />
        </div>
        {illustrated && <p className="mt-2 text-xs text-muted-foreground">Ilustrasi produk</p>}
        {images.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-3" aria-label="Galeri foto produk">
            {images.map((image, index) => (
              <button key={`${image}-${index}`} type="button" onClick={() => setPhoto(index)} aria-label={`Tampilkan foto ${index + 1}`}
                aria-pressed={index === photo}
                className="relative size-16 overflow-hidden rounded-lg border-2 hover:border-accent aria-pressed:border-primary sm:size-20">
                <ProductImage src={image} alt="" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">{product.name}</h1>
          <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
        </div>
        <p className="mt-4 text-2xl font-bold text-primary">{formatRupiah(product.price)}</p>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 text-sm">
          <div><dt className="font-bold text-primary">Bahan</dt><dd className="mt-1">{product.material || "Belum dicantumkan"}</dd></div>
          <div><dt className="font-bold text-primary">Berat</dt><dd className="mt-1">{product.weight_gram} gram</dd></div>
        </dl>

        <div className="mt-6 grid gap-4">
          {product.variants.length > 0 && (
            <label className="grid gap-2 text-sm font-bold text-primary">
              Varian
              <select value={variant ?? ""} onChange={(event) => setVariant(event.target.value)}
                className="min-h-11 rounded-lg border border-input bg-card px-3 font-normal">
                {product.variants.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          )}
          <div>
            <p className="text-sm font-bold text-primary" id="product-quantity">Jumlah</p>
            <div role="group" aria-labelledby="product-quantity" className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border bg-card">
                <button type="button" aria-label="Kurangi jumlah" disabled={qty <= 1} className={quantityButton}
                  onClick={() => setRequestedQty(qty - 1)}><Minus size={18} aria-hidden="true" /></button>
                <output className="w-10 text-center text-sm">{qty}</output>
                <button type="button" aria-label="Tambah jumlah" disabled={qty >= available} className={quantityButton}
                  onClick={() => setRequestedQty(qty + 1)}><Plus size={18} aria-hidden="true" /></button>
              </div>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {product.stock === 0 ? "Stok habis" : available === 0 ? "Seluruh stok tersedia sudah di keranjang" : `${available} tersedia untuk ditambahkan`}
              </span>
            </div>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" disabled={addDisabled} onClick={() => purchase(false)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary px-3 text-sm font-bold text-primary enabled:hover:bg-secondary disabled:opacity-45">
              <ShoppingBag size={16} aria-hidden="true" /> Tambah ke Keranjang
            </button>
            <button type="button" disabled={addDisabled} onClick={() => purchase(true)}
              className="min-h-12 rounded-lg bg-accent px-3 text-sm font-bold text-accent-foreground enabled:hover:bg-accent-hover disabled:opacity-45">
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
