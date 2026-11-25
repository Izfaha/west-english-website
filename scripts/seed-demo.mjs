import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "west_user",
  password: process.env.DB_PASSWORD || "west_password",
  database: process.env.DB_NAME || "west_db",
});

const admins = [
  ["faiz.admin@west.test", "Faiz", "WestDemoFaiz2026!"],
  ["amel.admin@west.test", "Amel", "WestDemoAmel2026!"],
];
const names = [
  "Nadia Putri Ramadhani", "Rizky Maulana", "Alya Salsabila", "Fajar Aditya",
  "Keisya Maharani", "Dimas Pratama", "Nisa Aulia", "Bayu Saputra",
  "Intan Permata", "Rafi Akbar", "Dewi Lestari", "Bagas Setiawan",
  "Rara Anggraini", "Bima Nugraha", "Tiara Safitri", "Reza Ramadhan",
  "Putri Wulandari", "Adit Firmansyah", "Kirana Putri", "Arga Kurniawan",
];
const categories = [["Kids", 10], ["Teenager", 15], ["Adult", 21]];

try {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    for (const [email, name, password] of admins) {
      const salt = randomBytes(16).toString("hex");
      const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
      await db.execute(
        "INSERT INTO west_admin_accounts (email, name, password_hash) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = id",
        [email, name, hash],
      );
    }

    const usedLeads = [];
    for (const [index, name] of names.entries()) {
      const number = index + 1;
      const [category, age] = categories[index % categories.length];
      const monthly = index % 2 === 0;
      const email = `pendaftar-demo-${number}@west.test`;
      const [existing] = await db.execute(
        "SELECT id FROM west_leads WHERE email = ? ORDER BY id LIMIT 1",
        [email],
      );
      const voucher = number <= 10 ? `WEST-DEMO-${String(number).padStart(3, "0")}` : null;
      const discount = voucher ? (monthly ? 51000 : 65000) : 0;
      let leadId = existing[0]?.id;
      if (!leadId) {
        const [result] = await db.execute(
          `INSERT INTO west_leads
           (nama, jenis_kelamin, umur, ttl, alamat, whatsapp, email, program, level, voucher_code, discount_amount, total_bayar, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TIMESTAMPADD(DAY, ?, NOW()))`,
          [name, monthly ? "Perempuan" : "Laki-laki", age, "Semarang, data demo", "Alamat demo",
           `08000000${String(number).padStart(4, "0")}`, email, `${category} / ${monthly ? "Month" : "2 Weeks"}`,
           "Basic", voucher, discount, (monthly ? 250000 : 165000) - discount, -index * 7],
        );
        leadId = result.insertId;
      }
      if (voucher) usedLeads.push({ leadId, index });
    }

    for (let number = 1; number <= 30; number++) {
      const used = usedLeads[number - 1];
      const expiryOffset = number > 25 ? -1 : 30;
      await db.execute(
        `INSERT INTO west_vouchers
         (code, discount_1bulan, discount_2minggu, expires_at, is_used, used_by_lead_id, used_at, created_at)
         VALUES (?, 51000, 65000, TIMESTAMPADD(DAY, ?, NOW()), ?, ?,
           TIMESTAMPADD(DAY, ?, NOW()), TIMESTAMPADD(DAY, ?, NOW()))
         ON DUPLICATE KEY UPDATE id = id`,
        [`WEST-DEMO-${String(number).padStart(3, "0")}`, expiryOffset, used ? 1 : 0,
         used?.leadId ?? null, used ? -used.index * 7 : null, used ? -used.index * 7 - 1 : -3],
      );
    }
    await db.commit();
    console.log("Data demo siap: 2 Admin, 20 pendaftar, dan 30 voucher.");
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
} finally {
  await pool.end();
}
