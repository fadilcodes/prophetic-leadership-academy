import "server-only";

import { sendProgramConfirmation } from "@/lib/email";
import { midtransAmountMatches } from "@/lib/midtrans";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { ProgramRegistration } from "@/types/database";

export const registrationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type AdminClient = ReturnType<typeof createAdminClient>;

export async function confirmProgramRegistration(db: AdminClient, registration: ProgramRegistration) {
  if (registration.confirmation_sent_at) return;
  const { data: program, error } = await db.from("programs")
    .select("id, title, schedule_date, location_or_platform").eq("id", registration.program_id).single();
  if (error) throw error;
  await sendProgramConfirmation(db, registration, program);
}

export async function recordProgramPayment(
  db: AdminClient,
  registration: ProgramRegistration,
  status: "PAID" | "EXPIRED",
  grossAmount: string,
) {
  if (!registration.midtrans_order_id || !midtransAmountMatches(grossAmount, registration.payment_amount)
    || registration.payment_amount === null) {
    throw new Error("Nominal pembayaran tidak cocok.");
  }
  const { data, error } = await db.rpc("update_program_payment", {
    p_order_id: registration.midtrans_order_id,
    p_amount: registration.payment_amount,
    p_status: status,
  });
  if (error) throw error;

  if (data.pay_status === "PAID") await confirmProgramRegistration(db, data);
}
