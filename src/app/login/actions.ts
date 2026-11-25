"use server";

import { redirect } from "next/navigation";
import { endAdminSession, getAdmin, startAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/admin-data";
import { rateLimit } from "@/lib/rate-limit";

export async function login(_state: string, form: FormData): Promise<string> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || email.length > 255 || !password || password.length > 256) {
    return "Isi email dan kata sandi dengan benar.";
  }
  if (!rateLimit("west:admin:login")) return "Terlalu banyak percobaan. Coba lagi dalam satu menit.";
  try {
    const admin = await verifyAdminCredentials(email, password);
    if (!admin) return "Email atau kata sandi salah.";
    await recordActivity(admin.email, "login", "Admin masuk ke dashboard.");
    await startAdminSession(admin, form.get("remember") === "on");
  } catch (error) {
    console.error("Gagal memulai sesi admin", error);
    return "Login belum bisa diproses. Coba lagi nanti.";
  }
  redirect("/admin");
}

export async function logout() {
  const admin = await getAdmin();
  await endAdminSession();
  if (admin) {
    await recordActivity(admin.email, "logout", "Admin keluar dari dashboard.").catch(console.error);
  }
  redirect("/login");
}
