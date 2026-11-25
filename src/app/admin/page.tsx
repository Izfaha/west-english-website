import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { actions, adminStats, listActivity, listLeads, readFilters, registrationTrend, voucherStatuses, type Search } from "@/lib/admin-data";
import { Cards, Heading, LeadsTable, formatCount, formatDateTime } from "./ui";

export default async function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const months = (await searchParams).months === "12" ? 12 : 6;
  const [stats, trend, leads, activity] = await Promise.all([
    adminStats(), registrationTrend(months),
    listLeads({ ...readFilters({}), limit: 4 }),
    listActivity({ ...readFilters({}), limit: 4 }),
  ]);
  const top = Math.max(1, ...trend.map(({ total }) => total));
  const available = stats.vouchers.available ?? 0;
  const used = stats.vouchers.used ?? 0;
  const availableEnd = stats.voucherTotal ? available / stats.voucherTotal * 100 : 0;
  const usedEnd = stats.voucherTotal ? (available + used) / stats.voucherTotal * 100 : 0;
  const distribution = stats.voucherTotal
    ? `conic-gradient(#18776d 0 ${availableEnd}%, #203d63 ${availableEnd}% ${usedEnd}%, #d8e2e7 ${usedEnd}% 100%)`
    : "#d8e2e7";

  return <>
    <Heading title="Dashboard" subtitle="Ringkasan aktivitas WEST.">
      <span className="west-date">{new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" }).format(new Date())}</span>
    </Heading>
    <Cards items={[
      { label: "Total Pendaftar", count: stats.leadTotal, icon: "◎" },
      { label: "Total Kupon", count: stats.voucherTotal, icon: "◇" },
      { label: "Kupon Belum Digunakan", count: available, icon: "□" },
      { label: "Kupon Sudah Digunakan", count: used, icon: "▣" },
    ]} />
    <section className="west-card west-section">
      <div className="west-section-head"><div><h2>Statistik Pendaftaran</h2><p>Jumlah pendaftar per bulan</p></div>
        <form className="west-period" action="/admin"><select name="months" defaultValue={months} aria-label="Periode statistik"><option value="6">6 bulan terakhir</option><option value="12">12 bulan terakhir</option></select><button className="west-button west-outline">Lihat</button></form>
      </div>
      <div className="west-chart">{trend.map(({ label, total }, index) => (
        <div key={index}><span>{formatCount(total)}</span><i style={{ height: `${total / top * 115 + 2}px` }} /><small>{label}</small></div>
      ))}</div>
    </section>
    <section className="west-card west-section">
      <div className="west-section-head"><div><h2>Penggunaan Kupon</h2><p>Distribusi status kupon</p></div></div>
      <div className="west-distribution"><div className="west-donut" style={{ background: distribution }}><div><strong>{formatCount(stats.voucherTotal)}</strong><small>Total Kupon</small></div></div>
        <ul>{Object.entries(voucherStatuses).map(([key, label]) => <li key={key}><span className={`west-dot ${key}`} />{label}<b>{formatCount(stats.vouchers[key] ?? 0)}</b></li>)}</ul>
      </div>
    </section>
    <section className="west-card">
      <div className="west-section-head west-section"><div><h2>Pendaftaran Terbaru</h2><p>Siswa yang baru mendaftar</p></div><Link href="/admin/pendaftaran">Lihat semua ›</Link></div>
      <LeadsTable leads={leads.rows} />
    </section>
    <section className="west-card west-section">
      <div className="west-section-head"><div><h2>Aktivitas Terbaru</h2><p>Aktivitas Admin</p></div><Link href="/admin/aktivitas">Lihat semua ›</Link></div>
      {activity.rows.length ? <ul className="west-recent">{activity.rows.map((item) => <li key={item.id}><div><b>{actions[item.action]}</b><small>{item.description}</small></div><time dateTime={item.created_at.toISOString()}>{formatDateTime(item.created_at)}</time></li>)}</ul> : <p className="west-muted">Belum ada aktivitas.</p>}
    </section>
  </>;
}
