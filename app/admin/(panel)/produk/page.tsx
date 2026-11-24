import Link from "next/link";

import { deleteContent, saveProduct } from "../actions";
import { AdminTable, Checkbox, Editor, Field, Notice, Pager, secondaryButton, tableRow } from "@/components/admin/AdminUI";
import { DeleteAction } from "@/components/admin/DeleteAction";
import { requireAdmin } from "@/lib/admin/auth";
import { pageNumber, pageSize, validId } from "@/lib/admin/forms";
import { formatRupiah } from "@/lib/merchandise";

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/produk">) {
  const db = await requireAdmin();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const edit = validId(params.edit);
  const [products, detail] = await Promise.all([
    db.from("products").select("id, name, price, stock, is_active", { count: "exact" })
      .order("name").order("id").range((page - 1) * pageSize, page * pageSize - 1),
    edit ? db.from("products").select("*").eq("id", edit).maybeSingle() : null,
  ]);
  if (products.error || detail?.error) throw new Error("Produk belum dapat dimuat.");
  const item = detail?.data;

  return (
    <>
      <h1 className="text-4xl">Produk Merchandise</h1>
      <Notice params={params} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <AdminTable columns={["Produk", "Harga", "Stok", "Status", "Aksi"]} empty={!products.data.length}>
            {products.data.map((product) => <tr key={product.id} className={tableRow}>
              <td className="font-semibold text-primary">{product.name}</td><td>{formatRupiah(product.price)}</td>
              <td>{product.stock}</td><td>{product.is_active ? "Aktif" : "Nonaktif"}</td>
              <td><div className="flex items-center gap-1">
                <Link href={`?edit=${product.id}&page=${page}#editor`} className={secondaryButton}>Edit</Link>
                <DeleteAction id={product.id} action={deleteContent.bind(null, "product")} />
              </div></td>
            </tr>)}
          </AdminTable>
          <Pager path="/admin/produk" page={page} count={products.count ?? 0} />
        </section>
        <div id="editor">
          <Editor key={item?.id ?? "new"} title={item ? "Edit produk" : "Tambah produk"} id={item?.id} base="/admin/produk" action={saveProduct}>
            {item && <input type="hidden" name="previous_stock" value={item.stock} />}
            <Field name="name" label="Nama produk" value={item?.name} maxLength={180} required />
            <Field name="slug" label="Slug" value={item?.slug} maxLength={160} required />
            <Field name="description" label="Deskripsi" value={item?.description} maxLength={20_000} area required />
            <Field name="material" label="Bahan" value={item?.material} maxLength={400} />
            <div className="grid grid-cols-2 gap-3">
              <Field name="price" label="Harga (Rp)" value={item?.price} type="number" min={0} required />
              <Field name="weight_gram" label="Berat (gram)" value={item?.weight_gram} type="number" min={1} required />
            </div>
            <Field name="stock" label="Stok tersedia" value={item?.stock} type="number" min={0} required />
            <Field name="variants" label="Varian (satu per baris)" value={item?.variants.join("\n")} area rows={3} maxLength={20_000} />
            <Field name="images_url" label="URL galeri (satu per baris)" value={item?.images_url.join("\n")} area rows={3} maxLength={20_000} />
            <Checkbox name="is_active" label="Tampilkan produk" checked={item?.is_active ?? true} />
          </Editor>
        </div>
      </div>
    </>
  );
}
