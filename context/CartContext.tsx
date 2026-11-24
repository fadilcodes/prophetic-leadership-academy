"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

import { merchandiseLineKey, orderNumberPattern, uuidPattern } from "@/lib/merchandise";
import { getPublicImageUrl } from "@/lib/public-url";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  weight_gram: number;
  variant: string | null;
  qty: number;
  stock: number;
  image: string | null;
}

type PurchasedLine = Pick<CartItem, "productId" | "variant" | "qty">;
type CartSnapshot = { ready: boolean; items: CartItem[]; pending: Record<string, PurchasedLine[]> };

const storageKey = "pla-merchandise-cart-v1";
const emptySnapshot: CartSnapshot = { ready: false, items: [], pending: {} };
let snapshot = emptySnapshot;
let serialized: string | null | undefined;
const listeners = new Set<() => void>();

function isPurchaseLine(raw: unknown): raw is PurchasedLine {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as PurchasedLine;
  return typeof item.productId === "string" && uuidPattern.test(item.productId)
    && (item.variant === null || typeof item.variant === "string" && item.variant.length > 0 && item.variant.length <= 100)
    && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= 1000;
}

function isCartItem(raw: unknown): raw is CartItem {
  if (!isPurchaseLine(raw)) return false;
  const item = raw as CartItem;
  return typeof item.name === "string" && item.name.length > 0
    && Number.isSafeInteger(item.price) && item.price >= 0
    && Number.isSafeInteger(item.weight_gram) && item.weight_gram > 0
    && Number.isSafeInteger(item.stock) && item.stock >= 0;
}

function readCart() {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (serialized !== value) {
      const parsed = JSON.parse(value ?? "{}");
      const pending = parsed?.pending && typeof parsed.pending === "object" ? Object.entries(parsed.pending) : [];
      snapshot = {
        ready: true,
        items: Array.isArray(parsed?.items) ? parsed.items.filter(isCartItem).map((item: CartItem) => ({
          ...item, image: getPublicImageUrl(item.image),
        })) : [],
        pending: Object.fromEntries(pending.filter((entry): entry is [string, PurchasedLine[]] => {
          const [key, lines] = entry;
          return key.startsWith("ORD-") && orderNumberPattern.test(key.slice(4))
            && Array.isArray(lines) && lines.every(isPurchaseLine);
        })),
      };
      serialized = value;
    }
  } catch {
    if (!snapshot.ready) snapshot = { ...emptySnapshot, ready: true };
  }
  return snapshot;
}

function writeCart(next: CartSnapshot) {
  snapshot = next;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ items: next.items, pending: next.pending }));
    serialized = window.localStorage.getItem(storageKey);
  } catch {
    // The cart remains usable for the current page when storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function sync(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) listener();
  }
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}

function addItem(item: CartItem) {
  const cart = readCart();
  const key = merchandiseLineKey(item.productId, item.variant);
  const current = cart.items.find((line) => merchandiseLineKey(line.productId, line.variant) === key);
  const total = cart.items.filter((line) => line.productId === item.productId).reduce((sum, line) => sum + line.qty, 0);
  if (!isCartItem(item) || item.qty + total > item.stock || item.qty + (current?.qty ?? 0) > 1000
    || (!current && cart.items.length >= 30)) return false;

  const items = cart.items.map((line) => {
    if (line.productId !== item.productId) return line;
    return { ...item, variant: line.variant, qty: current === line ? line.qty + item.qty : line.qty };
  });
  if (!current) items.push(item);
  writeCart({ ...cart, items });
  return true;
}

function setQuantity(productId: string, variant: string | null, qty: number) {
  const cart = readCart();
  const key = merchandiseLineKey(productId, variant);
  const current = cart.items.find((line) => merchandiseLineKey(line.productId, line.variant) === key);
  if (!current || !Number.isInteger(qty) || qty < 0 || qty > 1000) return;
  const otherQty = cart.items.filter((line) => line !== current && line.productId === productId)
    .reduce((sum, line) => sum + line.qty, 0);
  if (qty > current.qty && qty + otherQty > current.stock) return;
  const items = qty ? cart.items.map((line) => line === current ? { ...line, qty } : line) : cart.items.filter((line) => line !== current);
  writeCart({ ...cart, items });
}

function rememberPurchase(orderId: string, items: CartItem[]) {
  const cart = readCart();
  const lines = items.map(({ productId, variant, qty }) => ({ productId, variant, qty }));
  const pending = Object.fromEntries([...Object.entries(cart.pending).slice(-19), [orderId, lines]]);
  writeCart({ ...cart, pending });
}

function consumePurchase(orderId: string) {
  const cart = readCart();
  const purchase = cart.pending[orderId];
  if (!purchase) return;

  const quantities = new Map(purchase.map((line) => [merchandiseLineKey(line.productId, line.variant), line.qty]));
  const items = cart.items.map((line) => ({
    ...line,
    qty: line.qty - (quantities.get(merchandiseLineKey(line.productId, line.variant)) ?? 0),
  })).filter((line) => line.qty > 0);
  const pending = { ...cart.pending };
  delete pending[orderId];
  writeCart({ ...cart, items, pending });
}

type CartContextValue = Pick<CartSnapshot, "ready" | "items"> & {
  addItem: typeof addItem; setQuantity: typeof setQuantity;
  rememberPurchase: typeof rememberPurchase; consumePurchase: typeof consumePurchase;
};

const CartContext = createContext<CartContextValue | null>(null);
const getServerSnapshot = () => emptySnapshot;

export function CartProvider({ children }: { children: ReactNode }) {
  const { ready, items } = useSyncExternalStore(subscribe, readCart, getServerSnapshot);
  return (
    <CartContext.Provider value={{ ready, items, addItem, setQuantity, rememberPurchase, consumePurchase }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Keranjang harus berada dalam CartProvider.");
  return cart;
}
