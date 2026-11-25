import { requireAdmin } from "@/lib/admin-auth";
import { actions, listActivity, readFilters, type Search } from "@/lib/admin-data";
import { FilterForm, Heading, Pagination, Table, formatDateTime } from "../ui";

const path = "/admin/aktivitas";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const filters = readFilters(await searchParams);
  const { rows, page, total } = await listActivity(filters);
  return <>
    <Heading label="Khusus Admin" title="Log Aktivitas" subtitle="Pantau aktivitas Admin dalam sistem." />
    <section className="west-card">
      <FilterForm path={path} filters={filters} label="Semua Aktivitas" placeholder="Cari aktivitas…" options={actions} />
      <Table headers={["No.", "Admin", "Aktivitas", "Deskripsi", "Waktu"]} rows={rows.map((row, index) => [
        (page - 1) * filters.limit + index + 1, row.actor,
        <span key="action" className="west-pill">{actions[row.action]}</span>, row.description, formatDateTime(row.created_at),
      ])} />
      <Pagination path={path} filters={filters} page={page} total={total} count={rows.length} />
    </section>
  </>;
}
