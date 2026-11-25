import { requireAdmin } from "@/lib/admin-auth";
import { adminStats, listLeads, programs, readFilters, type Search } from "@/lib/admin-data";
import { Cards, FilterForm, Heading, LeadsTable, Pagination, filterUrl } from "../ui";

const path = "/admin/pendaftaran";

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const filters = readFilters(await searchParams);
  const [stats, { rows, page, total }] = await Promise.all([adminStats(), listLeads(filters)]);
  return <>
    <Heading label="Data Siswa" title="Data Pendaftaran" subtitle="Kelola seluruh data pendaftaran siswa WEST.">
      <a className="west-button west-outline" href={filterUrl("/api/admin/pendaftaran/export", filters)}>↓ &nbsp; Export Data</a>
    </Heading>
    <Cards items={[
      { label: "Total Pendaftar", count: stats.leadTotal, icon: "◎" },
      ...programs.map((program, index) => ({ label: `Program ${program}`, count: stats.leads[program] ?? 0, icon: ["▤", "◇", "◉"][index] })),
    ]} />
    <section className="west-card">
      <FilterForm path={path} filters={filters} label="Semua Program" placeholder="Cari nama atau email…" options={Object.fromEntries(programs.map((program) => [program, program]))} />
      <LeadsTable leads={rows} offset={(page - 1) * filters.limit} />
      <Pagination path={path} filters={filters} page={page} total={total} count={rows.length} />
    </section>
  </>;
}
