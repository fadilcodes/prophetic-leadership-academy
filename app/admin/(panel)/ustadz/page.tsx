import { SubmitButton } from "@/components/ui/SubmitButton";

import Link from "next/link";

import { deleteContent, saveUstadz, toggleUstadz } from "../actions";
import { AdminTable, Checkbox, Editor, Field, Notice, Pager, secondaryButton, tableRow } from "@/components/admin/AdminUI";
import { DeleteAction } from "@/components/admin/DeleteAction";
import { requireAdmin } from "@/lib/admin/auth";
import { pageNumber, pageSize, validId } from "@/lib/admin/forms";

export default async function UstadzAdmin({ searchParams }: PageProps<"/admin/ustadz">) {
  const db = await requireAdmin();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const edit = validId(params.edit);
  const [profiles, detail] = await Promise.all([
    db.from("ustadz_profiles").select("id, name, title, expertise_tags, is_active", { count: "exact" })
      .order("name").order("id").range((page - 1) * pageSize, page * pageSize - 1),
    edit ? db.from("ustadz_profiles").select("*").eq("id", edit).maybeSingle() : null,
  ]);
  if (profiles.error || detail?.error) throw new Error("Profil ustadz belum dapat dimuat.");
  const item = detail?.data;

  return (
    <>
      <h1 className="text-4xl">Jejaring Ustadz</h1>
      <Notice params={params} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <AdminTable columns={["Nama", "Keahlian", "Status", "Aksi"]} empty={!profiles.data.length}>
            {profiles.data.map((profile) => <tr key={profile.id} className={tableRow}>
              <td><p className="font-semibold text-primary">{profile.name}</p><p className="text-muted-foreground">{profile.title}</p></td>
              <td>{profile.expertise_tags.join(", ") || "—"}</td>
              <td>{profile.is_active ? "Aktif" : "Nonaktif"}</td>
              <td><div className="flex min-w-40 flex-wrap items-center gap-1">
                <Link href={`?edit=${profile.id}&page=${page}#editor`} className={secondaryButton}>Edit</Link>
                <form action={toggleUstadz.bind(null, profile.id, !profile.is_active)}>
                  <SubmitButton className={secondaryButton}>{profile.is_active ? "Nonaktifkan" : "Aktifkan"}</SubmitButton>
                </form>
                <DeleteAction id={profile.id} action={deleteContent.bind(null, "ustadz")} />
              </div></td>
            </tr>)}
          </AdminTable>
          <Pager path="/admin/ustadz" page={page} count={profiles.count ?? 0} />
        </section>
        <div id="editor">
          <Editor key={item?.id ?? "new"} title={item ? "Edit profil" : "Tambah profil"} id={item?.id} base="/admin/ustadz" action={saveUstadz}>
            <Field name="name" label="Nama" value={item?.name} maxLength={150} required />
            <Field name="title" label="Gelar atau peran" value={item?.title} maxLength={180} required />
            <Field name="bio" label="Biografi" value={item?.bio} maxLength={20_000} area required />
            <Field name="photo_url" label="URL foto" value={item?.photo_url} maxLength={2048} />
            <Field name="expertise_tags" label="Tag keahlian (satu per baris)" value={item?.expertise_tags.join("\n")} maxLength={20_000} area rows={3} />
            <Checkbox name="is_active" label="Tampilkan profil" checked={item?.is_active ?? true} />
          </Editor>
        </div>
      </div>
    </>
  );
}
