import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin-auth";
import { exportLeads, readFilters } from "@/lib/admin-data";

export function csvCell(value: string) {
  const safe = /^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/.test(value) ? "'" + value : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(req: NextRequest) {
  if (!await getAdmin()) return Response.json({ error: "Login diperlukan." }, { status: 401 });
  const rows = await exportLeads(readFilters(Object.fromEntries(req.nextUrl.searchParams)));
  const lines = ["Nama,Email,WhatsApp,Program,Tanggal"];
  for (const row of rows) {
    lines.push([row.nama, row.email, row.whatsapp, row.program, row.created_at.toISOString()].map(csvCell).join(","));
  }
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pendaftaran-west.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
