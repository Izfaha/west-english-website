# Autentikasi (AUTH)

Autentikasi hanya berlaku untuk **portal admin**. Halaman publik
(`/`, `/pendaftaran`, `/tutor`) dan endpoint pendaftaran/validasi kupon
tidak butuh sesi.

**Sumber kebenaran:** `src/lib/admin-auth.ts`, `src/app/login/actions.ts`,
`src/app/login/page.tsx`, `src/app/admin/layout.tsx`.

---

## 1. URL

| Fungsi | URL | Didefinisikan di |
|:---|:---|:---|
| Login | **`/login`** | `src/app/login/page.tsx` |
| Dashboard | `/admin` | `src/app/admin/page.tsx` |
| Generate kupon | `/admin/kupon` | `src/app/admin/kupon/page.tsx` |
| Data pendaftaran | `/admin/pendaftaran` | `src/app/admin/pendaftaran/page.tsx` |
| Log aktivitas | `/admin/aktivitas` | `src/app/admin/aktivitas/page.tsx` |
| Logout | form di sidebar | `src/app/admin/layout.tsx` → `logout` |

> `/api/vouchers/generate` adalah **endpoint**, bukan halaman login.

---

## 2. Alur tanpa sesi (redirect)

```
GET /admin        ─┐
GET /admin/*      ─┼─► requireAdmin() ─► redirect("/login")   [307]
GET /login        ─┘   (bila getAdmin() === null)

GET /login  (sudah sesi) ─► redirect("/admin")               [307]

POST /login (valid)      ─► Set-Cookie + redirect("/admin")  [303]
POST /login (salah)      ─► 200, pesan error di halaman
POST /logout             ─► redirect("/login")
```

Implementasi:

- `requireAdmin()` → `src/lib/admin-auth.ts`
  ```ts
  export async function requireAdmin() {
    const admin = await getAdmin();
    if (!admin) redirect("/login");
    return admin;
  }
  ```
- `login` → `redirect("/admin")`, `logout` → `redirect("/login")`
  (`src/app/login/actions.ts`)

**Tidak ada `middleware.ts`** di repository ini. Proteksi halaman murni dari
pemanggilan `requireAdmin()` di dalam server component
(`src/app/admin/layout.tsx` dan tiap halaman admin).

---

## 3. Sesi (cookie)

| Properti | Nilai |
|:---|:---|
| Nama cookie | `west_admin_session` |
| Nilai cookie | token acak 64 karakter hex (`randomBytes(32)` → hex) |
| Disimpan di DB | **SHA-256** dari token (`hashToken()`), bukan token asli |
| `httpOnly` | ya |
| `sameSite` | `lax` |
| `secure` | hanya bila `NODE_ENV === "production"` |
| `path` | `/` |
| `maxAge` | hanya saat "Ingat saya" dicentang |

**Umur sesi:**

| Opsi | Umur |
|:---|:---|
| Ingat saya dicentang | 7 hari (`7 * 86400`) |
| Tidak dicentang | 8 jam (`8 * 3600`) — session cookie browser |

**Tabel:** `west_admin_sessions`
(`token_hash` PK, `expires_at`, `admin_id`, `legacy_email`).

Pembacaan sesi (`getAdmin`):

1. Ambil cookie → wajib cocok `/^[a-f0-9]{64}$/`.
2. Query `token_hash` **dan** `expires_at > UTC_TIMESTAMP()` dengan LEFT JOIN
   ke `west_admin_accounts`.
3. Jika akun ada → kembalikan `{ id, email, name }`.
4. Jika tidak → coba jalur legacy (lihat §5).
5. Selain itu → `null`.

Pembersihan: setiap kali login berhasil, baris yang sudah lewat
`expires_at` dihapus (`DELETE ... WHERE expires_at <= UTC_TIMESTAMP()`).

---

## 4. Password

`verifyAdminCredentials(email, password)` — `src/lib/admin-auth.ts`:

1. Cari akun di `west_admin_accounts` berdasarkan email.
2. Jika tidak ada, coba jalur legacy (§5).
3. Baca `password_hash`, validasi regex `^[a-f0-9]{32}:[a-f0-9]{128}$`.
   Jika format tidak valid, pakai salt/hash dummy
   (`"0".repeat(32)` / `"0".repeat(128)`) supaya tetap melakukan perhitungan.
4. Hitung `scrypt(password, salt, keylen=64)` → Buffer 64 byte.
5. Bandingkan dengan `timingSafeEqual` (constant-time).
6. Gagal → `null`. Berhasil → objek `Admin`.

Format & generator hash: [models-and-schema.md §5](models-and-schema.md#5-format-hash-password).

---

## 5. Jalur legacy berbasis environment

Mendukung admin yang tidak terdaftar di DB. **Nama variabel saja** (nilai
tidak didokumentasikan di sini):

| Variabel | Peran |
|:---|:---|
| `WEST_ADMIN_EMAIL` | email admin legacy |
| `WEST_ADMIN_PASSWORD_HASH` | hash scrypt berformat `salt:hash` |
| `WEST_ADMIN_NAME` | nama tampilan (opsional; fallback ke email) |

Aturan:

- Akun di `west_admin_accounts` **selalu didahulukan**.
- Jalur legacy hanya dipakai bila email cocok `WEST_ADMIN_EMAIL` **dan**
  hash valid.
- `Admin.id` menjadi `null` untuk akun legacy; sesi legacy menyimpan
  `legacy_email` di `west_admin_sessions`.
- Membaca sesi legacy juga menuntut `WEST_ADMIN_PASSWORD_HASH` ada.

Prosedur membuat hash: bagian *Portal Admin* di `README.md`.

---

## 6. Login & logout (server action)

`src/app/login/actions.ts` — fungsi `"use server"`, dipanggil
`useActionState` dari `src/app/login/LoginForm.tsx`.

### `login(state, form)`

| Langkah | Detail |
|:---|:---|
| 1. Validasi input | `email` ≤ 255, `password` ≤ 256, keduanya wajib |
| 2. Rate limit | `rateLimit("west:admin:login")` — key **global**, bukan per IP |
| 3. Verifikasi | `verifyAdminCredentials()` |
| 4. Catat aktivitas | `recordActivity(email, "login", "Admin masuk ke dashboard.")` |
| 5. Buat sesi | `startAdminSession(admin, remember)` |
| 6. Redirect | `redirect("/admin")` |

Pesan yang mungkin tampil di form:

- `"Isi email dan kata sandi dengan benar."`
- `"Terlalu banyak percobaan. Coba lagi dalam satu menit."`
- `"Email atau kata sandi salah."`
- `"Login belum bisa diproses. Coba lagi nanti."` (exception saat query)

### `logout()`

`getAdmin()` → `endAdminSession()` (hapus baris sesi + hapus cookie) →
catat `logout` bila ada admin → `redirect("/login")`.

---

## 7. Proteksi API

| Endpoint | Cek | Bila gagal |
|:---|:---|:---|
| `POST /api/vouchers/generate` | `await getAdmin()` | `401 { "error": "Login diperlukan." }` |
| `GET /api/admin/pendaftaran/export` | `await getAdmin()` | `401 { "error": "Login diperlukan." }` |

Endpoint publik (`/api/register`, `/api/validate-voucher`) tidak memeriksa
sesi — memang ditujukan untuk pengunjung.

---

## 8. Catatan keamanan

**Sudah dilakukan:**

- Token sesi tidak pernah disimpan mentah di DB (hanya SHA-256).
- `httpOnly` + `sameSite=lax` pada cookie.
- `secure` otomatis di production.
- Perbandingan password constant-time (`timingSafeEqual`).
- Rate limit pada percobaan login.
- Cek `Origin` pada endpoint pembuatan kupon (CSRF sederhana).
- Semua query memakai parameter binding (`?`), bukan string interpolation.

**Yang perlu diketahui:**

- Rate limit memakai `Map` in-memory → **per proses**, hilang saat restart,
  dan tidak berbagi antar instance. Lihat
  [throttling-pagination-filtering.md](throttling-pagination-filtering.md).
- `getClientIp` membaca `x-forwarded-for` pertama — nilai ini bisa dipalsukan
  klien bila tidak ada proxy tepercaya di depannya.
- Tidak ada proteksi brute-force selain rate limit (tidak ada lockout akun).
- Cookie `secure` mengikuti `NODE_ENV`, bukan konfigurasi eksplisit.
