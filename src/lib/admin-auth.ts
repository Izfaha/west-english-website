import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

const deriveKey = promisify(scrypt);
const cookieName = "west_admin_session";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

interface Admin {
  id: number | null;
  email: string;
  name: string;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<Admin | null> {
  const [rows] = await getPool().execute<(RowDataPacket & Admin & { password_hash: string })[]>(
    "SELECT id, email, name, password_hash FROM west_admin_accounts WHERE email = ?",
    [email],
  );
  const account = rows[0];
  const legacyEmail = process.env.WEST_ADMIN_EMAIL?.trim();
  const isLegacy = !account && email.toLowerCase() === legacyEmail?.toLowerCase();
  const stored = account?.password_hash ?? (isLegacy ? process.env.WEST_ADMIN_PASSWORD_HASH : undefined);
  const validHash = stored && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored);
  const [salt, hash] = validHash ? stored.split(":") : ["0".repeat(32), "0".repeat(128)];
  const actual = await deriveKey(password, salt, 64) as Buffer;
  if (!timingSafeEqual(actual, Buffer.from(hash, "hex")) || !validHash) return null;
  if (account) return { id: account.id, email: account.email, name: account.name };
  if (!isLegacy || !legacyEmail) return null;
  return { id: null, email: legacyEmail, name: process.env.WEST_ADMIN_NAME?.trim() || legacyEmail };
}

export async function getAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [rows] = await getPool().execute<(RowDataPacket & Admin & { legacy_email: string | null })[]>(
    `SELECT a.id, a.email, a.name, s.legacy_email
     FROM west_admin_sessions s LEFT JOIN west_admin_accounts a ON a.id = s.admin_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()`,
    [hashToken(token)],
  );
  const account = rows[0];
  if (account?.id) return account;
  const email = process.env.WEST_ADMIN_EMAIL?.trim();
  if (!email || account?.legacy_email !== email || !process.env.WEST_ADMIN_PASSWORD_HASH) return null;
  return { id: null, email, name: process.env.WEST_ADMIN_NAME?.trim() || email };
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}

export async function startAdminSession(admin: Admin, remember: boolean) {
  const token = randomBytes(32).toString("hex");
  const lifetime = remember ? 7 * 86400 : 8 * 3600;
  const pool = getPool();
  await pool.execute("DELETE FROM west_admin_sessions WHERE expires_at <= UTC_TIMESTAMP()");
  await pool.execute(
    "INSERT INTO west_admin_sessions (token_hash, expires_at, admin_id, legacy_email) VALUES (?, TIMESTAMPADD(SECOND, ?, UTC_TIMESTAMP()), ?, ?)",
    [hashToken(token), lifetime, admin.id, admin.id === null ? admin.email : null],
  );
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: lifetime } : {}),
  });
}

export async function endAdminSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await getPool().execute("DELETE FROM west_admin_sessions WHERE token_hash = ?", [hashToken(token)]);
  jar.delete(cookieName);
}
