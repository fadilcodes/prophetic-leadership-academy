import { NextResponse } from "next/server";

import { maxShippingWeight, parseMerchandiseItems, parseShippingDestination } from "@/lib/merchandise";
import { getOrderTotals } from "@/lib/merchandise-orders";
import { getShippingRates } from "@/lib/shipping";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const destination = parseShippingDestination(body?.destination);
  const items = body?.items === undefined ? undefined : parseMerchandiseItems(body.items);
  if (!destination || items === null || (!items && (
    !Number.isInteger(body?.weight) || body.weight < 1 || body.weight > maxShippingWeight
  ))) {
    return NextResponse.json({ error: "Periksa kecamatan atau kode pos dan berat kiriman." }, { status: 400 });
  }

  try {
    if (items) {
      const totals = await getOrderTotals(createAdminClient(), items);
      if ("error" in totals) return NextResponse.json({ error: totals.error }, { status: 409 });
      return NextResponse.json({ ...await getShippingRates(destination, totals.weight, totals.subtotal), subtotal: totals.subtotal });
    }
    return NextResponse.json(await getShippingRates(destination, body.weight));
  } catch (error) {
    console.error("Kalkulasi ongkir gagal:", error instanceof Error ? error.message : "Database");
    return NextResponse.json({ error: "Ongkir belum dapat dihitung. Silakan coba lagi." }, { status: 503 });
  }
}
