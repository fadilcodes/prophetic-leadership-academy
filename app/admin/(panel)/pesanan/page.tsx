import { FilterForm } from "@/components/ui/FilterForm";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { AdminTable, Pager, SelectField, secondaryButton, tableRow } from "@/components/admin/AdminUI";
import { TrackingDialog } from "@/components/admin/TrackingDialog";
import { requireAdmin } from "@/lib/admin/auth";
import { fulfillmentStatuses, orderPaymentStatuses, statusLabels, statusOptions } from "@/lib/admin/filters";
import { formatAdminDate, pageNumber, pageSize, queryChoice } from "@/lib/admin/forms";
import { formatRupiah } from "@/lib/merchandise";

export default async function OrdersAdmin({ searchParams }: PageProps<"/admin/pesanan">) {
  const db = await requireAdmin();
  const params = await searchParams;
  const payment = queryChoice(params.bayar, orderPaymentStatuses);
  const fulfillment = queryChoice(params.kirim, fulfillmentStatuses);
  const page = pageNumber(params.page);
  const query = db.from("orders").select(
    "id, order_number, customer_name, customer_email, phone_wa, full_address, district, city, province, postal_code, courier_name, courier_service, total_amount, pay_status, fulfillment_status, tracking_number, tracking_email_sent_at, midtrans_order_id, created_at",
    { count: "exact" },
  ).order("created_at", { ascending: false }).order("id").range((page - 1) * pageSize, page * pageSize - 1);
  if (payment) query.eq("pay_status", payment);
  if (fulfillment) query.eq("fulfillment_status", fulfillment);
  const { data, count, error } = await query;
  if (error) throw new Error("Pesanan belum dapat dimuat.");

  return (
    <>
      <h1 className="text-4xl">Pesanan & Pengiriman</h1>
      <FilterForm key={JSON.stringify([payment, fulfillment])} action="/admin/pesanan" className="my-5 flex flex-wrap items-end gap-3">
        <SelectField name="bayar" label="Status bayar" value={payment} options={statusOptions(orderPaymentStatuses)} />
        <SelectField name="kirim" label="Status pengiriman" value={fulfillment} options={statusOptions(fulfillmentStatuses)} />
        <SubmitButton className={secondaryButton}>Terapkan</SubmitButton>
      </FilterForm>
      <AdminTable columns={["Pesanan", "Penerima", "Status", "Pengiriman"]} empty={!data.length}>
        {data.map((order) => (
          <tr key={order.id} className={tableRow}>
            <td className="min-w-40">
              <p className="break-all font-semibold text-primary">{order.order_number}</p>
              <p className="mt-1 text-muted-foreground">{formatAdminDate(order.created_at)}</p>
              <p className="mt-1">{formatRupiah(order.total_amount)}</p>
              <p className="mt-2 break-all font-mono text-xs">{order.midtrans_order_id ?? "—"}</p>
            </td>
            <td className="min-w-56">
              <p className="font-semibold text-primary">{order.customer_name}</p>
              <p className="break-all">{order.customer_email}</p>
              <p>{order.phone_wa}</p>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{order.full_address}</p>
              <p className="text-muted-foreground">{order.district}, {order.city}, {order.province} {order.postal_code}</p>
            </td>
            <td className="min-w-32">
              <p>{statusLabels[order.pay_status]}</p>
              <p className="mt-1 font-semibold text-primary">{statusLabels[order.fulfillment_status]}</p>
            </td>
            <td className="min-w-44">
              <p className="font-semibold text-primary">{order.courier_name} {order.courier_service}</p>
              {order.tracking_number && <p className="mb-2 mt-1 break-all font-mono text-xs">{order.tracking_number}</p>}
              {order.pay_status === "PAID" && ["PROCESSING", "SHIPPED"].includes(order.fulfillment_status) &&
                <div className="mt-2"><TrackingDialog id={order.id} number={order.order_number}
                  trackingNumber={order.tracking_number} notified={Boolean(order.tracking_email_sent_at)} /></div>}
            </td>
          </tr>
        ))}
      </AdminTable>
      <Pager path="/admin/pesanan" page={page} count={count ?? 0}
        filters={{ ...(payment ? { bayar: payment } : {}), ...(fulfillment ? { kirim: fulfillment } : {}) }} />
    </>
  );
}
