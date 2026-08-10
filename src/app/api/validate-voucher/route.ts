import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req.headers))) {
    return NextResponse.json({ valid: false, error: "Terlalu banyak permintaan, coba lagi nanti" }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, error: "Kode voucher harus diisi" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM west_vouchers WHERE code = ? LIMIT 1",
      [code.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ valid: false, error: "Voucher tidak ditemukan" });
    }

    const voucher = rows[0];

    if (voucher.is_used) {
      return NextResponse.json({ valid: false, error: "Voucher sudah pernah digunakan" });
    }

    if (voucher.expires_at && new Date() > new Date(voucher.expires_at)) {
      return NextResponse.json({ valid: false, error: "Voucher sudah kadaluarsa" });
    }

    return NextResponse.json({
      valid: true,
      discount_1bulan: voucher.discount_1bulan,
      discount_2minggu: voucher.discount_2minggu,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Gagal terhubung ke database" }, { status: 500 });
  }
}
