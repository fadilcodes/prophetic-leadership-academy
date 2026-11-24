"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { CartDrawer } from "@/components/merchandise/CartDrawer";
import { useCart } from "@/context/CartContext";
import { formatRupiah, merchandiseLineKey, type ShippingDestination, type ShippingEstimate } from "@/lib/merchandise";

const destinationFields = [
  { name: "province", label: "Provinsi", autoComplete: "address-level1" },
  { name: "city", label: "Kota/Kabupaten", autoComplete: "address-level2" },
  { name: "district", label: "Kecamatan", autoComplete: "address-level3" },
  { name: "postalCode", label: "Kode Pos", autoComplete: "postal-code" },
] as const;

const contactFields = [
  { name: "name", label: "Nama", type: "text", autoComplete: "name", maxLength: 100 },
  { name: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 254 },
  { name: "phone", label: "No. WhatsApp", type: "tel", autoComplete: "tel", maxLength: 25 },
] as const;

const fieldClass = "min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm font-normal text-foreground";
const labelClass = "grid gap-2 text-sm font-bold text-primary";
const emptyDestination: ShippingDestination = { province: "", city: "", district: "", postalCode: "" };

function newOrderNumber() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function CheckoutForm() {
  const { ready, items, rememberPurchase } = useCart();
  const [destination, setDestination] = useState<ShippingDestination>(emptyDestination);
  const [rateId, setRateId] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [quoteResult, setQuoteResult] = useState<{ key: string; quote?: ShippingEstimate; error?: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const order = useRef<{ payload: string; number: string } | null>(null);
  const requestActive = useRef(false);
  const merchandise = useMemo(() => items.map((item) => ({
    product_id: item.productId, variant: item.variant, qty: item.qty,
  })), [items]);

  const addressComplete = Boolean(destination.province.trim() && destination.city.trim() && destination.district.trim()
    && /^[1-9]\d{4}$/.test(destination.postalCode));
  const quoteRequest = ready && merchandise.length > 0 && addressComplete
    ? JSON.stringify({ destination, items: merchandise }) : "";
  const quoteKey = `${attempt}:${quoteRequest}`;
  const activeQuote = quoteResult?.key === quoteKey ? quoteResult : undefined;
  const rates = activeQuote?.quote?.rates ?? [];
  const selected = rates.find((rate) => rate.id === rateId);
  const subtotal = activeQuote?.quote?.subtotal ?? items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const fetchingRates = Boolean(quoteRequest && !activeQuote);

  useEffect(() => {
    if (!quoteRequest) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: quoteRequest,
          signal: controller.signal,
        });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok && Array.isArray(data.rates)) {
          setQuoteResult({ key: quoteKey, quote: data });
        } else {
          setQuoteResult({ key: quoteKey, error: data.error ?? "Ongkir belum dapat dihitung." });
        }
      } catch {
        if (!controller.signal.aborted) setQuoteResult({ key: quoteKey, error: "Ongkir belum dapat dihitung." });
      }
    }, 500);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [quoteRequest, quoteKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestActive.current || !selected || !activeQuote?.quote) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"), email: form.get("email"), phone: form.get("phone"), address: form.get("address"),
      destination, items: merchandise, rateId: selected.id, subtotal, shippingCost: selected.cost,
    };
    const identity = JSON.stringify(payload);
    if (order.current?.payload !== identity) order.current = { payload: identity, number: newOrderNumber() };
    requestActive.current = true;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, orderNumber: order.current.number }),
      });
      const data = await response.json();
      if (response.ok && typeof data.redirect_url === "string" && typeof data.order_id === "string") {
        rememberPurchase(data.order_id, items);
        window.location.assign(data.redirect_url);
        return;
      }
      if (data.code === "NEW_ATTEMPT") order.current = null;
      if (data.code === "REQUOTE") {
        order.current = null;
        setRateId("");
        setAttempt((value) => value + 1);
      }
      setError(data.error ?? "Pesanan belum dapat diproses.");
    } catch {
      setError("Pesanan belum dapat diproses. Silakan coba lagi.");
    }
    requestActive.current = false;
    setSubmitting(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-7">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Checkout</h1>
        <CartDrawer />
      </div>
      {!ready ? <p role="status" className="mt-8 text-muted-foreground">Memuat keranjang…</p>
        : items.length === 0 ? (
          <div className="mt-8 rounded-xl border bg-card p-6">
            <p className="text-muted-foreground">Keranjang Anda masih kosong.</p>
            <Link href="/merchandise" className="mt-3 inline-flex min-h-11 items-center font-bold text-primary underline">
              Lihat merchandise
            </Link>
          </div>
        ) : (
          <form action="/api/orders/checkout" method="post" onSubmit={submit}
            className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
            <fieldset disabled={submitting} className="min-w-0 rounded-xl border bg-card p-5 sm:p-6">
              <h2 className="text-2xl">Alamat pengiriman</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {contactFields.map((field) => (
                  <label key={field.name} className={labelClass}>{field.label}
                    <input name={field.name} type={field.type} autoComplete={field.autoComplete} maxLength={field.maxLength} required className={fieldClass} />
                  </label>
                ))}
                {destinationFields.map((field) => (
                  <label key={field.name} className={labelClass}>{field.label}
                    <input name={field.name} autoComplete={field.autoComplete} value={destination[field.name]} required
                      maxLength={field.name === "postalCode" ? 5 : 100}
                      inputMode={field.name === "postalCode" ? "numeric" : undefined}
                      pattern={field.name === "postalCode" ? "[1-9][0-9]{4}" : undefined}
                      onChange={(event) => {
                        setRateId("");
                        setDestination({ ...destination, [field.name]: event.target.value });
                      }}
                      className={fieldClass} />
                  </label>
                ))}
                <label className={`${labelClass} sm:col-span-2`}>Alamat Detail
                  <textarea name="address" autoComplete="street-address" required maxLength={500}
                    className={`${fieldClass} min-h-24 py-2`} />
                </label>
              </div>
            </fieldset>

            <section className="min-w-0 rounded-xl border bg-card p-5 sm:p-6">
              <h2 className="text-2xl">Ringkasan pesanan</h2>
              <ul className="mt-3 divide-y">
                {items.map((item) => (
                  <li key={merchandiseLineKey(item.productId, item.variant)} className="py-3 text-sm">
                    <p className="font-semibold text-primary">{item.name}</p>
                    <p className="mt-1 text-muted-foreground">{item.variant ? `${item.variant} · ` : ""}{item.qty} item</p>
                  </li>
                ))}
              </ul>
              <label className={`${labelClass} mt-3`}>Layanan kurir
                <select value={selected?.id ?? ""} onChange={(event) => setRateId(event.target.value)}
                  disabled={!rates.length || submitting} required className={fieldClass}>
                  <option value="">Pilih layanan kurir</option>
                  {rates.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.courier} {rate.service} · {formatRupiah(rate.cost)}{rate.eta ? ` · ${rate.eta}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div aria-live="polite" className="mt-2 text-sm text-muted-foreground">
                {!addressComplete && "Isi provinsi, kota, kecamatan, dan kode pos untuk menghitung ongkir."}
                {fetchingRates && "Menghitung ongkir…"}
                {activeQuote?.error && (
                  <>
                    <p className="text-destructive">{activeQuote.error}</p>
                    <button type="button" className="min-h-11 font-bold text-primary underline" onClick={() => setAttempt((value) => value + 1)}>
                      Coba lagi
                    </button>
                  </>
                )}
                {activeQuote?.quote && !rates.length && "Layanan kurir belum tersedia untuk tujuan ini. Periksa kembali alamat."}
                {activeQuote?.quote?.estimated && <p>Tarif simulasi untuk pengembangan.</p>}
              </div>

              <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{formatRupiah(subtotal)}</dd></div>
                <div className="flex justify-between gap-3"><dt>Ongkir</dt><dd>{selected ? formatRupiah(selected.cost) : "—"}</dd></div>
                <div className="flex justify-between gap-3 border-t pt-3 text-base font-bold text-primary">
                  <dt>Total</dt><dd>{selected ? formatRupiah(subtotal + selected.cost) : "—"}</dd>
                </div>
              </dl>
              {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={!selected || fetchingRates || submitting}
                className="mt-4 min-h-12 w-full rounded-lg bg-accent px-3 text-sm font-bold text-accent-foreground disabled:opacity-50">
                {submitting ? "Menyiapkan pembayaran…" : "Bayar dengan Midtrans"}
              </button>
            </section>
          </form>
        )}
    </>
  );
}
