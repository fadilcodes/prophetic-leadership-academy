import { NextResponse } from "next/server";

import { cancelMidtransSnapSession, createMidtransTransaction, getMidtransTransactionStatus, mapMidtransStatus } from "@/lib/midtrans";
import { confirmProgramRegistration, recordProgramPayment, registrationIdPattern } from "@/lib/program-registration";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const registrationErrors: Record<string, { message: string; status: number }> = {
  PROGRAM_NOT_FOUND: { message: "Program tidak ditemukan.", status: 404 },
  PROGRAM_CLOSED: { message: "Pendaftaran program sudah ditutup.", status: 409 },
  PROGRAM_CAPACITY: { message: "Seluruh tempat sedang terisi atau menunggu pembayaran.", status: 409 },
  REGISTRATION_CONFLICT: { message: "Data pendaftaran sudah tercatat. Gunakan data awal untuk mencoba lagi.", status: 409 },
};

function parseRegistration(body: Record<string, unknown>) {
  if (!body) return null;
  const { registration_id, slug, name, email, phone, institution } = body;
  if (typeof registration_id !== "string" || !registrationIdPattern.test(registration_id)
    || typeof slug !== "string" || slug.length === 0 || slug.length > 200
    || typeof name !== "string" || name.trim().length === 0 || name.trim().length > 100
    || typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    || typeof phone !== "string" || !/^\+?[\d ()-]{8,25}$/.test(phone.trim())
    || (institution !== undefined && (typeof institution !== "string" || institution.trim().length > 150))) {
    return null;
  }

  const normalizedPhone = phone.trim().replace(/[ ()-]/g, "");
  if (!/^\+?\d{8,15}$/.test(normalizedPhone)) return null;

  return {
    p_id: registration_id,
    p_slug: slug,
    p_name: name.trim(),
    p_email: email.trim().toLowerCase(),
    p_phone: normalizedPhone,
    p_institution: typeof institution === "string" ? institution.trim() || null : null,
  };
}

async function reconcileExpiredReservations(db: ReturnType<typeof createAdminClient>, slug: string) {
  const { data: program, error: programError } = await db.from("programs")
    .select("id").eq("slug", slug).single();
  if (programError) throw programError;

  // A Snap session without a selected payment method may expire without a Core API transaction.
  // A successful Snap cancellation confirms that a shared payment link cannot be used.
  const graceCutoff = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data, error } = await db.from("program_registrations").select("*")
    .eq("program_id", program.id).eq("pay_status", "PENDING")
    .not("midtrans_order_id", "is", null).lt("payment_expires_at", graceCutoff)
    .order("payment_expires_at").limit(8);
  if (error) throw error;

  const results = await Promise.allSettled(data.map(async (registration) => {
    if (!registration.midtrans_order_id || !registration.payment_amount) return;
    const verified = await getMidtransTransactionStatus(registration.midtrans_order_id);
    if (!verified) {
      const canceled = registration.midtrans_snap_token
        ? await cancelMidtransSnapSession(registration.midtrans_snap_token)
        : !registration.midtrans_redirect_url;
      if (canceled) await recordProgramPayment(db, registration, "EXPIRED", String(registration.payment_amount));
      return;
    }
    const status = mapMidtransStatus(verified);
    if (status) await recordProgramPayment(db, registration, status, verified.gross_amount);
  }));
  if (results.some((result) => result.status === "rejected")) {
    console.error("Sebagian reservasi program belum dapat disinkronkan.");
  }
}

export async function POST(request: Request) {
  const input = parseRegistration(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "Periksa kembali data pendaftaran Anda." }, { status: 400 });

  try {
    const db = createAdminClient();
    let result = await db.rpc("register_program", input);
    if (result.error?.message === "PROGRAM_CAPACITY") {
      await reconcileExpiredReservations(db, input.p_slug);
      result = await db.rpc("register_program", input);
    }
    if (result.error) {
      const expected = registrationErrors[result.error.message];
      if (expected) return NextResponse.json({ error: expected.message }, { status: expected.status });
      throw result.error;
    }

    const registration = result.data;
    if (registration.pay_status === "CONFIRMED" || registration.pay_status === "PAID") {
      try {
        await confirmProgramRegistration(db, registration);
      } catch {
        return NextResponse.json({
          error: "Pendaftaran tersimpan. Kirim ulang formulir dengan data yang sama untuk mencoba kembali pengiriman email.",
        }, { status: 503 });
      }
      return NextResponse.json({ redirect_url: `/program/sukses?id=${registration.id}` });
    }

    if (registration.pay_status === "EXPIRED"
      || (registration.payment_expires_at && Date.parse(registration.payment_expires_at) <= Date.now())) {
      return NextResponse.json({
        error: "Waktu pembayaran sudah habis. Muat ulang halaman untuk mendaftar kembali.",
      }, { status: 409 });
    }

    if (registration.midtrans_redirect_url) {
      return NextResponse.json({ redirect_url: registration.midtrans_redirect_url });
    }
    const { midtrans_order_id: orderId, payment_amount: amount, payment_expires_at: expiresAt } = registration;
    if (!orderId || !amount || !expiresAt) throw new Error("Detail reservasi pembayaran tidak lengkap.");

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (!appUrl || !/^https?:\/\//i.test(appUrl)) throw new Error("URL publik situs wajib diisi.");
    const finish = new URL("/program/sukses", appUrl);
    finish.searchParams.set("order_id", orderId);

    const { data: program, error: programError } = await db.from("programs").select("id, title")
      .eq("id", registration.program_id).single();
    if (programError) throw programError;

    const expiryStart = new Date(Date.parse(expiresAt) - 30 * 60_000 + 7 * 60 * 60_000).toISOString().slice(0, 19).replace("T", " ");
    const { token, redirect_url } = await createMidtransTransaction({
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: {
        first_name: registration.participant_name,
        email: registration.email,
        phone: registration.phone_wa,
      },
      item_details: [{ id: program.id, price: amount, quantity: 1, name: Array.from(program.title).slice(0, 50).join("") }],
      callbacks: { finish: finish.href },
      expiry: { start_time: `${expiryStart} +0700`, unit: "minutes", duration: 30 },
    });

    const { data: saved, error } = await db.from("program_registrations")
      .update({ midtrans_redirect_url: redirect_url, midtrans_snap_token: token })
      .eq("id", registration.id).eq("pay_status", "PENDING")
      .gt("payment_expires_at", new Date().toISOString())
      .is("midtrans_redirect_url", null).select("midtrans_redirect_url").maybeSingle();
    if (error) throw error;
    if (saved) return NextResponse.json({ redirect_url: saved.midtrans_redirect_url });

    const { data: current, error: reloadError } = await db.from("program_registrations")
      .select("pay_status, midtrans_redirect_url, payment_expires_at").eq("id", registration.id).single();
    if (reloadError) throw reloadError;
    if (current.pay_status === "PENDING" && current.midtrans_redirect_url
      && current.payment_expires_at && Date.parse(current.payment_expires_at) > Date.now()) {
      return NextResponse.json({ redirect_url: current.midtrans_redirect_url });
    }
    return NextResponse.json({ redirect_url: `/program/sukses?order_id=${orderId}` });
  } catch (error) {
    console.error("Pendaftaran program gagal diproses:", error instanceof Error ? error.message : "Database");
    return NextResponse.json({ error: "Pendaftaran belum dapat diproses. Silakan coba lagi." }, { status: 503 });
  }
}
