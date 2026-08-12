import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getPool } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const PRICE_MAP: Record<string, number> = {
  "Kids / Month": 250000,
  "Teenager / Month": 250000,
  "Adult / Month": 250000,
  "Kids / 2 Weeks": 165000,
  "Teenager / 2 Weeks": 165000,
  "Adult / 2 Weeks": 165000,
};

const VALID_LEVELS = ["Pre basic", "Basic", "Intermediate", "Advance"];

function sanitize(str: string): string {
  return str.replace(/[<>]/g, "").trim().slice(0, 500);
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req.headers))) {
    return NextResponse.json({ success: false, error: "Terlalu banyak permintaan, coba lagi nanti" }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { nama, jenis_kelamin, umur, ttl, alamat, email, whatsapp, program, level, voucher_code } = body;

  if (
    !nama || typeof nama !== "string" ||
    !jenis_kelamin || typeof jenis_kelamin !== "string" ||
    !umur || typeof umur !== "number" ||
    !ttl || typeof ttl !== "string" ||
    !alamat || typeof alamat !== "string" ||
    !email || typeof email !== "string" ||
    !whatsapp || typeof whatsapp !== "string" ||
    !program || typeof program !== "string"
  ) {
    return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 });
  }

  if (!level || !VALID_LEVELS.includes(level)) {
    return NextResponse.json({ success: false, error: "Level tidak valid" }, { status: 400 });
  }

  if (email && typeof email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: "Format email tidak valid" }, { status: 400 });
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(whatsapp)) {
    return NextResponse.json({ success: false, error: "Format nomor WhatsApp tidak valid" }, { status: 400 });
  }

  const basePrice = PRICE_MAP[program];
  if (basePrice === undefined) {
    return NextResponse.json({ success: false, error: "Program tidak valid" }, { status: 400 });
  }

  const pool = getPool();
  let discountAmount = 0;
  let voucherId: number | null = null;

  if (voucher_code && typeof voucher_code === "string") {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM west_vouchers WHERE code = ? LIMIT 1",
        [voucher_code.trim().toUpperCase()]
      );

      if (rows.length > 0) {
        const voucher = rows[0];
        const notExpired = !voucher.expires_at || new Date() <= new Date(voucher.expires_at);
        const notUsed = !voucher.is_used;

        if (notExpired && notUsed) {
          const isMonth = program.includes("Month");
          discountAmount = isMonth ? voucher.discount_1bulan : voucher.discount_2minggu;
          voucherId = voucher.id;
        }
      }
    } catch {
      // voucher validation failure — proceed without discount
    }
  }

  const totalBayar = Math.max(0, basePrice - discountAmount);

  const safeName = sanitize(nama);
  const safeJK = sanitize(jenis_kelamin);
  const safeUmur = Math.min(Math.max(Math.floor(umur), 1), 100);
  const safeTtl = sanitize(ttl);
  const safeAlamat = sanitize(alamat);
  const safeEmail = sanitize(email);
  const safeWa = sanitize(whatsapp);
  const safeVoucher = voucher_code ? sanitize(voucher_code).toUpperCase() : null;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO west_leads (nama, jenis_kelamin, umur, ttl, alamat, whatsapp, email, program, level, voucher_code, discount_amount, total_bayar, status_bayar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [safeName, safeJK, safeUmur, safeTtl, safeAlamat, safeWa, safeEmail, program, level, safeVoucher, discountAmount, totalBayar]
    );

    if (voucherId) {
      await pool.query(
        "UPDATE west_vouchers SET is_used = 1, used_by_lead_id = ?, used_at = NOW() WHERE id = ?",
        [result.insertId, voucherId]
      );
    }

    return NextResponse.json({ success: true, total_bayar: totalBayar });
  } catch {
    return NextResponse.json({ success: false, error: "Gagal menyimpan data pendaftaran" }, { status: 500 });
  }
}
