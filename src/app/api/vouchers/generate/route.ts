import { randomInt } from "node:crypto";
import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/admin-data";
import { getPool } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "WEST-" + Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export function validExpiry(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return false;
  const iso = value.replace(" ", "T") + ".000Z";
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) && date.toISOString() === iso && Number(value.slice(0, 4)) >= 1000;
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return Response.json({ error: "Login diperlukan." }, { status: 401 });
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "Gunakan Content-Type application/json." }, { status: 415 });
  }
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== host)) {
    return Response.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }
  if (!rateLimit("west:admin:vouchers")) return Response.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "JSON tidak valid." }, { status: 400 });
  }
  const { jumlah = 20, expires_at: expiresAt = null, discount_1bulan: month = 51000, discount_2minggu: fortnight = 65000 } = body;
  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 100 ||
      !Number.isInteger(month) || month < 0 || month > 250000 ||
      !Number.isInteger(fortnight) || fortnight < 0 || fortnight > 165000 ||
      (expiresAt !== null && !validExpiry(expiresAt))) {
    return Response.json({ error: "Periksa jumlah (1–100), batas diskon, dan tanggal kupon." }, { status: 400 });
  }

  const codes = new Set<string>();
  while (codes.size < jumlah) codes.add(generateCode());
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO west_vouchers (code, discount_1bulan, discount_2minggu, expires_at) VALUES ?",
      [Array.from(codes, (code) => [code, month, fortnight, expiresAt])],
    );
    await recordActivity(admin.email, "vouchers", `Membuat ${codes.size} kupon.`, connection);
    await connection.commit();
    return Response.json({ success: true, jumlah: codes.size, codes: Array.from(codes) });
  } catch (error) {
    await connection.rollback();
    console.error("Gagal membuat kupon", error);
    return Response.json({ error: "Gagal membuat kupon. Coba lagi." }, { status: 500 });
  } finally {
    connection.release();
  }
}
