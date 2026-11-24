import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminTable, Field, Pager, SelectField, primaryButton, secondaryButton, tableRow } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/admin/auth";
import { midtransOrderFilter, registrationStatuses, statusLabels, statusOptions } from "@/lib/admin/filters";
import { formatAdminDate, pageNumber, pageSize, queryChoice, validId } from "@/lib/admin/forms";

export default async function RegistrationsAdmin({ params, searchParams }: PageProps<"/admin/program/[id]/pendaftar">) {
  const db = await requireAdmin();
  const { id } = await params;
  if (!validId(id)) notFound();
  const options = await searchParams;
  const status = queryChoice(options.bayar, registrationStatuses);
  const orderId = midtransOrderFilter(options.midtrans);
  const filters = { ...(status ? { bayar: status } : {}), ...(orderId ? { midtrans: orderId } : {}) };
  const exportQuery = new URLSearchParams(filters).toString();
  const page = pageNumber(options.page);
  const path = `/admin/program/${id}/pendaftar`;

  const query = db.from("program_registrations")
    .select("id, participant_name, email, phone_wa, institution, pay_status, midtrans_order_id, created_at", { count: "exact" })
    .eq("program_id", id).order("created_at", { ascending: false }).order("id")
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (status) query.eq("pay_status", status);
  if (orderId) query.eq("midtrans_order_id", orderId);
  const [program, registrations] = await Promise.all([
    db.from("programs").select("title").eq("id", id).maybeSingle(),
    query,
  ]);
  if (program.error || registrations.error) throw new Error("Daftar pendaftar belum dapat dimuat.");
  if (!program.data) notFound();

  return (
    <>
      <Link href="/admin/program" className="inline-flex min-h-11 items-center text-sm font-bold text-primary underline">Kembali ke program</Link>
      <h1 className="mt-2 text-4xl">Pendaftar Program</h1>
      <p className="mt-2 font-semibold text-primary">{program.data.title}</p>
      <div className="my-5 flex flex-wrap items-end justify-between gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <SelectField name="bayar" label="Status bayar" value={status} options={statusOptions(registrationStatuses)} />
          <Field name="midtrans" label="ID Midtrans" value={orderId} maxLength={50} />
          <button className={secondaryButton}>Terapkan</button>
        </form>
        <a href={`${path}/export${exportQuery ? `?${exportQuery}` : ""}`} className={primaryButton}>Export CSV</a>
      </div>
      <AdminTable columns={["Peserta", "Kontak", "Instansi", "Status bayar", "ID Midtrans", "Tanggal daftar"]} empty={!registrations.data.length}>
        {registrations.data.map((row) => (
          <tr key={row.id} className={tableRow}>
            <td className="font-semibold text-primary">{row.participant_name}</td>
            <td><p className="break-all">{row.email}</p><p>{row.phone_wa}</p></td>
            <td>{row.institution || "—"}</td>
            <td>{statusLabels[row.pay_status]}</td>
            <td className="min-w-36 break-all font-mono text-xs">{row.midtrans_order_id || "—"}</td>
            <td className="min-w-32">{formatAdminDate(row.created_at)}</td>
          </tr>
        ))}
      </AdminTable>
      <Pager path={path} page={page} count={registrations.count ?? 0} filters={filters} />
    </>
  );
}
