import { SubmitButton } from "@/components/ui/SubmitButton";

import Link from "next/link";

import { deleteContent, saveArticle, saveCategory, toggleArticle } from "../actions";
import { AdminTable, Checkbox, Editor, Field, Notice, Pager, SelectField, secondaryButton, tableRow } from "@/components/admin/AdminUI";
import { DeleteAction } from "@/components/admin/DeleteAction";
import { requireAdmin } from "@/lib/admin/auth";
import { pageNumber, pageSize, validId } from "@/lib/admin/forms";

export default async function ArticlesAdmin({ searchParams }: PageProps<"/admin/artikel">) {
  const db = await requireAdmin();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const edit = validId(params.edit);
  const editCategory = validId(params.kategori);
  const [articles, categories, detail, categoryDetail] = await Promise.all([
    db.from("articles").select("id, title, is_published, article_categories(name)", { count: "exact" })
      .order("created_at", { ascending: false }).order("id").range((page - 1) * pageSize, page * pageSize - 1),
    db.from("article_categories").select("id, name, slug").order("name"),
    edit ? db.from("articles").select("*").eq("id", edit).maybeSingle() : null,
    editCategory ? db.from("article_categories").select("*").eq("id", editCategory).maybeSingle() : null,
  ]);
  if (articles.error || categories.error || detail?.error || categoryDetail?.error) throw new Error("Data artikel belum dapat dimuat.");
  const item = detail?.data;
  const category = categoryDetail?.data;

  return (
    <>
      <h1 className="text-4xl">Artikel</h1>
      <Notice params={params} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <AdminTable columns={["Judul", "Kategori", "Status", "Aksi"]} empty={!articles.data.length}>
            {articles.data.map((article) => <tr key={article.id} className={tableRow}>
              <td className="font-semibold text-primary">{article.title}</td>
              <td>{article.article_categories?.name}</td>
              <td>{article.is_published ? "Terbit" : "Draf"}</td>
              <td><div className="flex min-w-40 flex-wrap items-center gap-1">
                <Link href={`?edit=${article.id}&page=${page}#editor-artikel`} className={secondaryButton}>Edit</Link>
                <form action={toggleArticle.bind(null, article.id, !article.is_published)}>
                  <SubmitButton className={secondaryButton}>{article.is_published ? "Jadikan draf" : "Terbitkan"}</SubmitButton>
                </form>
                <DeleteAction id={article.id} action={deleteContent.bind(null, "article")} />
              </div></td>
            </tr>)}
          </AdminTable>
          <Pager path="/admin/artikel" page={page} count={articles.count ?? 0} />
          <h2 className="mb-3 mt-8 text-2xl">Kategori artikel</h2>
          <AdminTable columns={["Nama", "Slug", "Aksi"]} empty={!categories.data.length}>
            {categories.data.map((row) => <tr key={row.id} className={tableRow}>
              <td className="font-semibold text-primary">{row.name}</td><td>{row.slug}</td>
              <td><div className="flex items-center gap-1">
                <Link href={`?kategori=${row.id}#editor-kategori`} className={secondaryButton}>Edit</Link>
                <DeleteAction id={row.id} action={deleteContent.bind(null, "category")} />
              </div></td>
            </tr>)}
          </AdminTable>
        </section>

        <div className="grid content-start gap-5">
          <div id="editor-artikel">
            <Editor key={item?.id ?? "new"} title={item ? "Edit artikel" : "Tambah artikel"} id={item?.id} base="/admin/artikel" action={saveArticle}>
              <Field name="title" label="Judul" value={item?.title} maxLength={180} required />
              <Field name="slug" label="Slug" value={item?.slug} maxLength={160} required />
              <SelectField name="category_id" label="Kategori" value={item?.category_id} required options={[
                { value: "", label: "Pilih kategori" }, ...categories.data.map(({ id, name }) => ({ value: id, label: name })),
              ]} />
              <Field name="excerpt" label="Ringkasan" value={item?.excerpt} maxLength={500} area required />
              <Field name="content" label="Isi artikel (Markdown)" value={item?.content} maxLength={100_000} area rows={8} required />
              <Field name="thumbnail_url" label="URL gambar sampul" value={item?.thumbnail_url} maxLength={2048} />
              <Checkbox name="is_published" label="Terbitkan artikel" checked={item?.is_published} />
            </Editor>
          </div>
          <div id="editor-kategori">
            <Editor key={category?.id ?? "new"} title={category ? "Edit kategori" : "Tambah kategori"} id={category?.id} base="/admin/artikel" action={saveCategory}>
              <Field name="name" label="Nama kategori" value={category?.name} maxLength={100} required />
              <Field name="slug" label="Slug kategori" value={category?.slug} maxLength={160} required />
            </Editor>
          </div>
        </div>
      </div>
    </>
  );
}
