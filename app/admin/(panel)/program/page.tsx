import Link from "next/link";

import { deleteContent, saveProgram, saveProgramAccess } from "../actions";
import { AdminTable, Editor, Field, Notice, Pager, SelectField, primaryButton, secondaryButton, tableRow } from "@/components/admin/AdminUI";
import { DeleteAction } from "@/components/admin/DeleteAction";
import { requireAdmin } from "@/lib/admin/auth";
import { formatAdminDate, pageNumber, pageSize, validId } from "@/lib/admin/forms";
import { formatRupiah } from "@/lib/merchandise";
import { settingList } from "@/lib/site-information";

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

export default async function ProgramsAdmin({ searchParams }: PageProps<"/admin/program">) {
  const db = await requireAdmin();
  const params = await searchParams;
  const page = pageNumber(params.page);
  const edit = validId(params.edit);
  const [programs, speakers, detail, access] = await Promise.all([
    db.from("programs").select("id, title, schedule_date, price, quota, registered_count, status", { count: "exact" })
      .order("schedule_date", { ascending: false }).order("id").range((page - 1) * pageSize, page * pageSize - 1),
    db.from("ustadz_profiles").select("id, name").order("name"),
    edit ? db.from("programs").select("*").eq("id", edit).maybeSingle() : null,
    edit ? db.from("program_access_details").select("details").eq("program_id", edit).maybeSingle() : null,
  ]);
  if (programs.error || speakers.error || detail?.error || access?.error) throw new Error("Data program belum dapat dimuat.");
  const item = detail?.data;
  const schedule = item ? new Date(Date.parse(item.schedule_date) + 7 * 3_600_000).toISOString().slice(0, 16) : "";

  return (
    <>
      <h1 className="text-4xl">Program & Pendaftar</h1>
      <Notice params={params} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <AdminTable columns={["Program", "Peserta", "Status", "Aksi"]} empty={!programs.data.length}>
            {programs.data.map((program) => <tr key={program.id} className={tableRow}>
              <td><p className="font-semibold text-primary">{program.title}</p>
                <p className="mt-1 text-muted-foreground">{formatAdminDate(program.schedule_date)}</p>
                <p className="mt-1 text-muted-foreground">{program.price ? formatRupiah(program.price) : "Gratis"}</p>
              </td>
              <td className="whitespace-nowrap">{program.registered_count} / {program.quota}</td><td>{program.status}</td>
              <td><div className="flex min-w-40 flex-wrap items-center gap-1">
                <Link href={`/admin/program/${program.id}/pendaftar`} className={secondaryButton}>Pendaftar</Link>
                <Link href={`?edit=${program.id}&page=${page}#editor`} className={secondaryButton}>Edit</Link>
                <DeleteAction id={program.id} action={deleteContent.bind(null, "program")} />
              </div></td>
            </tr>)}
          </AdminTable>
          <Pager path="/admin/program" page={page} count={programs.count ?? 0} />
        </section>
        <div id="editor" className="grid content-start gap-5">
          <Editor key={item?.id ?? "new"} title={item ? "Edit program" : "Tambah program"} id={item?.id} base="/admin/program" action={saveProgram}>
            <Field name="title" label="Judul program" value={item?.title} maxLength={180} required />
            <Field name="slug" label="Slug" value={item?.slug} maxLength={160} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField name="category" label="Kategori" value={item?.category} options={toOptions(["Pelatihan", "Kajian", "Pendampingan"])} />
              <SelectField name="mode" label="Mode" value={item?.mode} options={toOptions(["Online", "Offline"])} />
            </div>
            <SelectField name="ustadz_id" label="Ustadz pemateri" value={item?.ustadz_id} options={[
              { value: "", label: "Belum ditetapkan" }, ...speakers.data.map(({ id, name }) => ({ value: id, label: name })),
            ]} />
            <Field name="schedule_date" label="Jadwal (WIB)" value={schedule} type="datetime-local" required />
            <Field name="location_or_platform" label="Lokasi atau platform publik" value={item?.location_or_platform} maxLength={300} required />
            <div className="grid grid-cols-2 gap-3">
              <Field name="price" label="Harga (Rp, 0 jika gratis)" value={item?.price ?? 0} type="number" min={0} required />
              <Field name="quota" label="Kuota" value={item?.quota} type="number" min={1} required />
            </div>
            <SelectField name="status" label="Status" value={item?.status} options={toOptions(["OPEN", "FULL", "COMPLETED"])} />
            <Field name="poster_url" label="URL poster" value={item?.poster_url} maxLength={2048} />
            <Field name="description" label="Deskripsi" value={item?.description} maxLength={20_000} area required />
            <Field name="syllabus" label="Silabus (satu topik per baris)" value={settingList(item?.syllabus).join("\n")} area maxLength={20_000} />
          </Editor>
          {item && <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-2xl">Akses peserta</h2>
            <form key={item.id} action={saveProgramAccess} className="grid gap-4">
              <input type="hidden" name="id" value={item.id} />
              <Field name="details" label="Tautan atau petunjuk untuk email konfirmasi" value={access?.data?.details} area maxLength={20_000} />
              <button className={primaryButton}>Simpan akses</button>
            </form>
          </section>}
        </div>
      </div>
    </>
  );
}
