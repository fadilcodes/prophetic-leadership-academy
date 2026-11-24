import { requireAdmin } from "@/lib/admin/auth";
import { midtransOrderFilter, registrationStatuses } from "@/lib/admin/filters";
import { queryChoice, validId } from "@/lib/admin/forms";

export const dynamic = "force-dynamic";

function csvValue(value: string | null) {
  const text = value ?? "";
  const safe = /^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request, { params }: RouteContext<"/admin/program/[id]/pendaftar/export">) {
  const db = await requireAdmin();
  const { id } = await params;
  if (!validId(id)) return new Response("Program tidak ditemukan.", { status: 404 });
  const { data: program, error } = await db.from("programs").select("id").eq("id", id).maybeSingle();
  if (error) return new Response("Program belum dapat dimuat.", { status: 503 });
  if (!program) return new Response("Program tidak ditemukan.", { status: 404 });

  const search = new URL(request.url).searchParams;
  const status = queryChoice(search.get("bayar") ?? undefined, registrationStatuses);
  const orderId = midtransOrderFilter(search.get("midtrans") ?? undefined);
  const batchSize = 500;
  function batch(after?: string) {
    const query = db.from("program_registrations")
      .select("id, participant_name, email, phone_wa, institution, pay_status, midtrans_order_id, created_at")
      .eq("program_id", id).order("id").limit(batchSize);
    if (after) query.gt("id", after);
    if (status) query.eq("pay_status", status);
    if (orderId) query.eq("midtrans_order_id", orderId);
    return query;
  }

  const first = await batch();
  if (first.error) return new Response("Daftar pendaftar belum dapat diekspor.", { status: 503 });

  const encoder = new TextEncoder();
  let rows = first.data;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("\uFEFFID Pendaftaran,Nama,Email,WhatsApp,Instansi,Status Bayar,ID Midtrans,Waktu Daftar (UTC)\r\n"));
    },
    async pull(controller) {
      if (rows.length === 0) return controller.close();
      const lines = rows.map((row) => [
        row.id, row.participant_name, row.email, row.phone_wa, row.institution, row.pay_status, row.midtrans_order_id, row.created_at,
      ].map(csvValue).join(","));
      controller.enqueue(encoder.encode(lines.join("\r\n") + "\r\n"));
      if (rows.length < batchSize) return controller.close();

      const next = await batch(rows[rows.length - 1].id);
      if (next.error) return controller.error(new Error("Ekspor pendaftar terputus."));
      rows = next.data;
    },
  });

  return new Response(stream, { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="pendaftar-${program.id}.csv"`,
    "Cache-Control": "private, no-store",
  } });
}
