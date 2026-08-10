import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "WEST-";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const jumlah = body.jumlah || 20;
  const expiresAt = body.expires_at || null;
  const discount1bulan = body.discount_1bulan || 51000;
  const discount2minggu = body.discount_2minggu || 65000;

  const codes: string[] = [];
  const usedCodes = new Set<string>();

  while (codes.length < jumlah) {
    const code = generateCode();
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      codes.push(code);
    }
  }

  const pool = getPool();
  const values = codes.map((code) => [code, discount1bulan, discount2minggu, expiresAt]);

  try {
    await pool.query(
      `INSERT INTO west_vouchers (code, discount_1bulan, discount_2minggu, expires_at) VALUES ?`,
      [values]
    );
    return NextResponse.json({ success: true, jumlah: codes.length, codes });
  } catch (err) {
    return NextResponse.json({ error: "Gagal generate voucher", detail: String(err) }, { status: 500 });
  }
}
