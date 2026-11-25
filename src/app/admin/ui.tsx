import Link from "next/link";
import type { ReactNode } from "react";
import type { Lead, readFilters } from "@/lib/admin-data";

const number = new Intl.NumberFormat("id-ID");
const idDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const idDateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export const formatCount = (value: number) => number.format(value);
export const formatDate = (value: Date | null) => value ? idDate.format(value) : "—";
export const formatDateTime = (value: Date) => idDateTime.format(value);
export const formatMoney = (value: number) => `Rp${number.format(value)}`;

export function Brand() {
  return <div className="west-brand"><span aria-hidden="true" className="west-brand-icon"><i /><i /></span><div><b>WEST</b><small>Kampung Inggris</small></div></div>;
}

export function Heading({ label, title, subtitle, children }: { label?: string; title: string; subtitle: string; children?: ReactNode }) {
  return <div className="west-heading"><div>{label && <p className="west-eyebrow">{label}</p>}<h1>{title}</h1><p className="west-muted">{subtitle}</p></div>{children}</div>;
}

export function Cards({ items }: { items: { label: string; count: number; icon: string }[] }) {
  return <div className="west-cards">{items.map(({ label, count, icon }) => (
    <article className="west-card west-metric" key={label}><span aria-hidden="true">{icon}</span><div><small>{label}</small><strong>{formatCount(count)}</strong></div></article>
  ))}</div>;
}

export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="west-table-scroll" tabIndex={0} role="region" aria-label="Tabel data">
    <table><thead><tr>{headers.map((text) => <th scope="col" key={text}>{text}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{cell}</td>)}</tr>) : <tr><td className="west-empty" colSpan={headers.length}>Belum ada data yang cocok.</td></tr>}</tbody>
    </table>
  </div>;
}

export function LeadsTable({ leads, offset = 0 }: { leads: Lead[]; offset?: number }) {
  return <Table headers={["No.", "Nama Lengkap", "Email", "WhatsApp", "Program", "Tanggal"]} rows={leads.map((lead, index) => [
    offset + index + 1,
    <span key="name" className="west-person"><span aria-hidden="true">{lead.nama.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span><b>{lead.nama}</b></span>,
    lead.email, lead.whatsapp, <span key="program" className="west-pill">{lead.program}</span>, formatDate(lead.created_at),
  ])} />;
}

type Filters = ReturnType<typeof readFilters>;

export function FilterForm({ path, filters, placeholder, label, options }: { path: string; filters: Filters; placeholder: string; label: string; options: Record<string, string> }) {
  return <form className="west-filters" action={path}>
    <input aria-label={placeholder} name="q" defaultValue={filters.query} placeholder={placeholder} maxLength={100} />
    <select aria-label={label} name="filter" defaultValue={Object.hasOwn(options, filters.filter) ? filters.filter : ""}>
      <option value="">{label}</option>
      {Object.entries(options).map(([key, text]) => <option value={key} key={key}>{text}</option>)}
    </select>
    <select aria-label="Baris per halaman" name="limit" defaultValue={filters.limit}>{[10, 25, 50].map((limit) => <option value={limit} key={limit}>{limit} baris</option>)}</select>
    <button className="west-button west-outline">Terapkan</button>
  </form>;
}

export function filterUrl(path: string, filters: Filters, page?: number) {
  const params = new URLSearchParams({ q: filters.query, filter: filters.filter, limit: String(filters.limit) });
  if (page !== undefined) params.set("page", String(page));
  return `${path}?${params}`;
}

export function Pagination({ path, filters, page, total, count }: { path: string; filters: Filters; page: number; total: number; count: number }) {
  const first = count ? (page - 1) * filters.limit + 1 : 0;
  const last = first ? first + count - 1 : 0;
  const pages = Math.max(1, Math.ceil(total / filters.limit));
  return <div className="west-pagination">
    <small>Menampilkan {first}–{last} dari {formatCount(total)} data</small>
    <nav aria-label="Pagination">
      {page > 1 && <Link aria-label="Halaman sebelumnya" href={filterUrl(path, filters, page - 1)}>‹</Link>}
      <span aria-current="page">{page} / {pages}</span>
      {page < pages && <Link aria-label="Halaman berikutnya" href={filterUrl(path, filters, page + 1)}>›</Link>}
    </nav>
  </div>;
}
