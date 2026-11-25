import { requireAdmin } from "@/lib/admin-auth";
import { adminStats, listVouchers, readFilters, voucherStatuses, type Search } from "@/lib/admin-data";
import { Cards, FilterForm, Heading, Pagination, Table, formatDate, formatMoney } from "../ui";
import CopyCode from "./CopyCode";
import VoucherForm from "./VoucherForm";

const path = "/admin/kupon";

export default async function VouchersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const filters = readFilters(await searchParams);
  const [stats, { rows, total, page }] = await Promise.all([adminStats(), listVouchers(filters)]);
  return <>
    <Heading title="Generate Kupon" label="Manajemen Kupon" subtitle="Buat dan kelola voucher diskon program WEST." />
    <VoucherForm />
    <Cards items={[
      { label: "Total Kupon", count: stats.voucherTotal, icon: "◇" },
      ...Object.entries(voucherStatuses).map(([status, label], index) => ({
        label, count: stats.vouchers[status] ?? 0, icon: ["□", "▣", "◷"][index],
      })),
    ]} />
    <section className="west-card">
      <FilterForm path={path} filters={filters} label="Semua Status" placeholder="Cari kode kupon…" options={voucherStatuses} />
      <Table headers={["No.", "Kode Kupon", "Diskon 1 Bulan", "Diskon 2 Minggu", "Dibuat", "Tenggat", "Digunakan", "Status"]} rows={rows.map((voucher, index) => [
        (page - 1) * filters.limit + index + 1, <CopyCode code={voucher.code} key={voucher.code} />,
        formatMoney(voucher.discount_1bulan), formatMoney(voucher.discount_2minggu),
        formatDate(voucher.created_at), formatDate(voucher.expires_at), formatDate(voucher.used_at),
        <span key="status" className={`west-pill ${voucher.status}`}>{voucherStatuses[voucher.status]}</span>,
      ])} />
      <Pagination path={path} filters={filters} page={page} total={total} count={rows.length} />
    </section>
  </>;
}
