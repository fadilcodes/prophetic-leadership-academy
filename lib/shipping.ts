import "server-only";

import { maxShippingWeight, type ShippingDestination, type ShippingEstimate, type ShippingRate } from "@/lib/merchandise";

const courierNames: Record<string, string> = { jne: "JNE", jnt: "J&T", sicepat: "SiCepat" };

function makeRate(code: unknown, service: unknown, cost: unknown, eta: unknown): ShippingRate[] {
  if (typeof code !== "string" || !Object.hasOwn(courierNames, code.toLowerCase())
    || typeof service !== "string" || !service.trim() || typeof cost !== "number"
    || !Number.isSafeInteger(cost) || cost < 0 || cost > 100_000_000) return [];
  const courierCode = code.toLowerCase();
  const serviceCode = service.trim().toUpperCase();
  return [{ id: `${courierCode}:${serviceCode}`, courier: courierNames[courierCode], service: serviceCode, cost, eta: typeof eta === "string" ? eta : "" }];
}

function locationName(value: unknown) {
  return typeof value === "string" ? value.toLowerCase().trim()
    .replace(/^(?:kab(?:upaten)?\.?|kota(?:\s+(?:adm\.?|administratif|administrasi))?|kec(?:amatan)?\.?|provinsi)\s+/, "")
    .replace(/[^a-z0-9]/g, "") : "";
}

function matchesLocation(input: string, actual: unknown) {
  return !input || locationName(input) === locationName(actual);
}

function developmentRates(destination: ShippingDestination, weight: number): ShippingRate[] {
  const prefix = Number(destination.postalCode.slice(0, 2));
  const province = locationName(destination.province);
  const local = prefix === 40 || province === "jawabarat" && locationName(destination.city).startsWith("bandung");
  const java = (prefix >= 10 && prefix <= 17) || (prefix >= 40 && prefix <= 69)
    || ["jawabarat", "jawatengah", "jawatimur", "banten", "dkijakarta", "diyogyakarta"].includes(province);
  const eastern = prefix >= 90 && prefix <= 99 || /papua|maluku/.test(province);
  const base = local ? 9_000 : java ? 15_000 : eastern ? 38_000 : 25_000;
  const kg = Math.ceil(weight / 1000);
  const eta = local ? "1–2 hari" : java ? "2–4 hari" : eastern ? "5–9 hari" : "3–6 hari";
  return [
    ...makeRate("jne", "REG", base * kg, eta),
    ...makeRate("jnt", "EZ", (base + 1_000) * kg, eta),
    ...makeRate("sicepat", java ? "BEST" : "REG", (base + (java ? 4_000 : 2_000)) * kg, java ? "1–2 hari" : eta),
  ];
}

async function getBiteshipRates(base: string, key: string, origin: string, destination: ShippingDestination, weight: number, value: number) {
  const headers = { Authorization: key, "Content-Type": "application/json" };
  let address: { destination_postal_code: number } | { destination_area_id: string };
  if (destination.postalCode) {
    address = { destination_postal_code: Number(destination.postalCode) };
  } else {
    const query = new URLSearchParams({
      countries: "ID", input: [destination.district, destination.city].filter(Boolean).join(", "), type: "single",
    });
    const response = await fetch(`${base}/v1/maps/areas?${query}`, { headers, signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data?.areas)) throw new Error("Pencarian area Biteship gagal.");
    const areaRows: Record<string, unknown>[] = data.areas;
    const areas = areaRows.filter((area): area is Record<string, unknown> & { id: string } => typeof area?.id === "string"
      && matchesLocation(destination.district, area.administrative_division_level_3_name)
      && matchesLocation(destination.city, area.administrative_division_level_2_name));
    if (areas.length !== 1) return [];
    address = { destination_area_id: areas[0].id };
  }

  const response = await fetch(`${base}/v1/rates/couriers`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(5000),
    body: JSON.stringify({
      ...(/^[1-9]\d{4}$/.test(origin) ? { origin_postal_code: Number(origin) } : { origin_area_id: origin }),
      ...address,
      couriers: "jne,jnt,sicepat",
      items: [{ name: "Merchandise PLA", weight, value, quantity: 1 }],
    }),
  });
  const data = await response.json();
  if ([40001001, 40001010].includes(Number(data?.code))) return [];
  if (!response.ok || !Array.isArray(data.pricing)) throw new Error(`Tarif Biteship tidak tersedia (HTTP ${response.status}).`);
  const pricing: (Record<string, unknown> | null)[] = data.pricing;
  return pricing.flatMap((row) => makeRate(row?.courier_code, row?.courier_service_code, row?.price, row?.duration));
}

async function getRajaOngkirRates(base: string, key: string, origin: string, destination: ShippingDestination, weight: number) {
  const query = new URLSearchParams({ search: destination.postalCode || destination.district, limit: "100", offset: "0" });
  const lookup = await fetch(`${base}/api/v1/destination/domestic-destination?${query}`, {
    headers: { key }, signal: AbortSignal.timeout(5000),
  });
  const area = await lookup.json();
  if (lookup.status === 404 || area?.meta?.code === 404) return [];
  if (!lookup.ok || !Array.isArray(area?.data)) throw new Error("Pencarian tujuan RajaOngkir gagal.");
  const destinations: (Record<string, unknown> | null)[] = area.data;
  const matches = destinations.filter((row): row is Record<string, unknown> => row !== null && /^\d+$/.test(String(row.id))
    && (!destination.postalCode || String(row.zip_code) === destination.postalCode)
    && matchesLocation(destination.district, row.district_name)
    && matchesLocation(destination.city, row.city_name));
  if (!matches.length) return [];
  const postalCodes = new Set(matches.map((row) => String(row.zip_code)));
  if (!destination.postalCode && postalCodes.size > 1) return [];

  const response = await fetch(`${base}/api/v1/calculate/domestic-cost`, {
    method: "POST",
    headers: { key, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ origin, destination: String(matches[0].id), weight: String(weight), courier: "jne:jnt:sicepat", price: "lowest" }),
    signal: AbortSignal.timeout(5000),
  });
  const data = await response.json();
  if ([400, 404].includes(data?.meta?.code) && data?.data === null) return [];
  if (!response.ok || !Array.isArray(data?.data)) throw new Error("Tarif RajaOngkir tidak tersedia.");
  const pricing: (Record<string, unknown> | null)[] = data.data;
  return pricing.flatMap((row) => makeRate(row?.code, row?.service, row?.cost, row?.etd));
}

export async function getShippingRates(destination: ShippingDestination, weight: number, value = 0): Promise<ShippingEstimate> {
  if (!Number.isInteger(weight) || weight < 1 || weight > maxShippingWeight) throw new Error("Berat kiriman di luar batas.");
  const key = process.env.SHIPPING_API_KEY?.trim();
  if (!key && process.env.NODE_ENV === "development") {
    return { rates: developmentRates(destination, weight), estimated: true, weight };
  }
  const origin = process.env.SHIPPING_ORIGIN_ID?.trim();
  const provider = process.env.SHIPPING_PROVIDER?.trim().toLowerCase() || "biteship";
  const overrideBase = process.env.SHIPPING_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!key || !origin) throw new Error("Konfigurasi provider ongkir belum lengkap.");

  let rates: ShippingRate[];
  if (provider === "biteship") {
    rates = await getBiteshipRates(overrideBase || "https://api.biteship.com", key, origin, destination, weight, value);
  } else if (provider === "rajaongkir" && /^\d+$/.test(origin)) {
    rates = await getRajaOngkirRates(overrideBase || "https://rajaongkir.komerce.id", key, origin, destination, weight);
  } else {
    throw new Error("Provider ongkir atau ID asal tidak valid.");
  }

  const options = new Map<string, ShippingRate>();
  for (const rate of rates.sort((a, b) => a.cost - b.cost)) {
    if (!options.has(rate.id)) options.set(rate.id, rate);
  }
  return { rates: [...options.values()], estimated: false, weight };
}
