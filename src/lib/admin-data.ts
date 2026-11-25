import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export const programs = ["Kids", "Teenager", "Adult"];
export const voucherStatuses = { available: "Belum Digunakan", used: "Sudah Digunakan", expired: "Kedaluwarsa" };
export const actions = { login: "Login", logout: "Logout", vouchers: "Buat Kupon" };
const voucherStatus = "CASE WHEN is_used = 1 THEN 'used' WHEN expires_at <= NOW() THEN 'expired' ELSE 'available' END";

export interface Lead extends RowDataPacket {
  id: number; nama: string; email: string; whatsapp: string; program: string; created_at: Date;
}
export interface Voucher extends RowDataPacket {
  id: number; code: string; discount_1bulan: number; discount_2minggu: number;
  created_at: Date; expires_at: Date | null; used_at: Date | null; status: keyof typeof voucherStatuses;
}
export interface Activity extends RowDataPacket {
  id: number; actor: string; action: keyof typeof actions; description: string; created_at: Date;
}

export type Search = Record<string, string | string[] | undefined>;
export function readFilters(params: Search) {
  const limit = [10, 25, 50].includes(Number(params.limit)) ? Number(params.limit) : 10;
  const page = Math.min(100000, Math.max(1, Math.floor(Number(params.page) || 1)));
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const filter = typeof params.filter === "string" ? params.filter : "";
  return { limit, page, query, filter };
}
type Filters = ReturnType<typeof readFilters>;

function conditions(query: string, columns: string[], filter?: [string, string]) {
  const predicates: string[] = [];
  const values: string[] = [];
  if (query) {
    predicates.push(`(${columns.map((column) => `LOCATE(?, ${column}) > 0`).join(" OR ")})`);
    values.push(...columns.map(() => query));
  }
  if (filter) {
    predicates.push(`${filter[0]} = ?`);
    values.push(filter[1]);
  }
  return { where: predicates.length ? `WHERE ${predicates.join(" AND ")}` : "", values };
}

function leadConditions(filters: Filters) {
  const category = programs.includes(filters.filter) ? filters.filter : "";
  return conditions(filters.query, ["nama", "email"], category ? ["SUBSTRING_INDEX(program, ' / ', 1)", category] : undefined);
}

async function readPage<T extends RowDataPacket>(select: string, table: string, clause: ReturnType<typeof conditions>, filters: Filters) {
  const pool = getPool();
  const [counts] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM ${table} ${clause.where}`, clause.values,
  );
  const total = Number(counts[0].total);
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / filters.limit)));
  const [rows] = await pool.execute<T[]>(
    `SELECT ${select} FROM ${table} ${clause.where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...clause.values, filters.limit, (page - 1) * filters.limit],
  );
  return { rows, total, page };
}

const leadFields = "id, nama, email, whatsapp, program, created_at";

export function listLeads(filters: Filters) {
  return readPage<Lead>(leadFields, "west_leads", leadConditions(filters), filters);
}

export async function exportLeads(filters: Filters) {
  const { where, values } = leadConditions(filters);
  const [rows] = await getPool().execute<Lead[]>(
    `SELECT ${leadFields} FROM west_leads ${where} ORDER BY created_at DESC, id DESC`, values,
  );
  return rows;
}

export function listVouchers(filters: Filters) {
  const status = Object.hasOwn(voucherStatuses, filters.filter) ? filters.filter : "";
  return readPage<Voucher>(
    `id, code, discount_1bulan, discount_2minggu, created_at, expires_at, used_at, ${voucherStatus} AS status`,
    "west_vouchers", conditions(filters.query, ["code"], status ? [`(${voucherStatus})`, status] : undefined), filters,
  );
}

export function listActivity(filters: Filters) {
  const action = Object.hasOwn(actions, filters.filter) ? filters.filter : "";
  return readPage<Activity>(
    "id, actor, action, description, created_at", "west_admin_activity",
    conditions(filters.query, ["actor", "description"], action ? ["action", action] : undefined), filters,
  );
}

export function recordActivity(actor: string, action: keyof typeof actions, description: string, db = getPool() as Pick<ReturnType<typeof getPool>, "execute">) {
  return db.execute("INSERT INTO west_admin_activity (actor, action, description) VALUES (?, ?, ?)", [actor, action, description]);
}

export async function adminStats() {
  const pool = getPool();
  const [[leadCounts], [voucherCounts]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT SUBSTRING_INDEX(program, ' / ', 1) AS category, COUNT(*) AS total FROM west_leads GROUP BY category"),
    pool.query<RowDataPacket[]>(`SELECT ${voucherStatus} AS status, COUNT(*) AS total FROM west_vouchers GROUP BY status`),
  ]);
  return {
    leadTotal: leadCounts.reduce((sum, row) => sum + Number(row.total), 0),
    voucherTotal: voucherCounts.reduce((sum, row) => sum + Number(row.total), 0),
    leads: Object.fromEntries(leadCounts.map((row) => [row.category, Number(row.total)])),
    vouchers: Object.fromEntries(voucherCounts.map((row) => [row.status, Number(row.total)])),
  };
}

export async function registrationTrend(months: number) {
  const [rows] = await getPool().execute<RowDataPacket[]>(`
    SELECT EXTRACT(YEAR_MONTH FROM created_at) AS monthKey, COUNT(*) AS total
    FROM west_leads
    WHERE created_at >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL ? MONTH)
    GROUP BY monthKey
  `, [months - 1]);
  const now = new Date();
  const label = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "Asia/Jakarta" });
  return Array.from({ length: months }, (_, index) => {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + index + 1, 1));
    const key = month.getUTCFullYear() * 100 + month.getUTCMonth() + 1;
    return { label: label.format(month), total: Number(rows.find((row) => Number(row.monthKey) === key)?.total ?? 0) };
  });
}
