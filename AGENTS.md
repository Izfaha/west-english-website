<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# WEST — Wavi English School & Training

Landing page + portal admin untuk pendaftaran kelas bahasa. Pengunjung umum melihat
halaman publik dan mendaftar; admin masuk lewat `/login` untuk mengelola pendaftaran,
kupon/voucher, dan log aktivitas.

## Stack & package manager

- **Next.js 16.3.0** (App Router, `src/app`) + React 19 + Tailwind CSS 4
- **MariaDB 10.6** via `mysql2` — driver di `src/lib/db.ts` (pool)
- **Package manager: Yarn 1.22.22** (`packageManager` di `package.json`, ada `yarn.lock`)
- Tidak ada ORM, tidak ada `middleware.ts` (routing sepenuhnya berbasis folder + `redirect()`)

## Peta direktori

```
src/app/layout.tsx              root layout (bukan halaman; tidak punya navbar)
src/app/(public)/layout.tsx     Navbar + Footer untuk semua halaman publik
src/app/(public)/page.tsx       /           beranda
src/app/(public)/pendaftaran/   /pendaftaran  form pendaftaran + validasi voucher live
src/app/(public)/tutor/         /tutor        daftar tutor
src/app/login/                  /login        page.tsx (server), LoginForm.tsx (client),
                                              actions.ts (server action: login/logout)
src/app/admin/                  /admin        layout.tsx = gerbang requireAdmin() + sidebar
  ├── page.tsx                  dashboard     kupon/page.tsx        generate & daftar kupon
  ├── pendaftaran/page.tsx      data pendaftar
  ├── aktivitas/page.tsx        log aktivitas
  ├── Navigation.tsx, ui.tsx, west.css        sidebar & styling admin
src/app/api/register/route.ts                    POST pendaftar (publik)
src/app/api/validate-voucher/route.ts           POST validasi kupon (publik)
src/app/api/vouchers/generate/route.ts          POST generate kupon (butuh sesi admin)
src/app/api/admin/pendaftaran/export/route.ts   GET export CSV (butuh sesi admin)
src/lib/admin-auth.ts           hash token, cookie, requireAdmin/getAdmin, sesi scrypt
src/lib/admin-data.ts           query dashboard/pendaftaran/kupon/aktivitas
src/lib/rate-limit.ts           in-memory sliding window (10 req/menit)
src/components/                 Navbar, Footer, AlertModal
database/init.sql               schema untuk DB baru (leads, vouchers, tabel admin)
database/migrations/            001_admin.sql, 002_admin_accounts.sql (DB yang sudah ada)
scripts/seed-demo.mjs           2 akun admin + data demo leads & kupon
docker-compose.yml              dev: db (3307), phpmyadmin (8082), frontend (3000)
docker-compose.prod.yml         prod: frontend (3000), phpmyadmin (8008), db (tanpa port)
nginx/                          reverse proxy opsional (80/443)
PRD.md, README.md               spesifikasi & dokumentasi operasional
CLAUDE.md                       berisi "@AGENTS.md" — ikuti file ini
```

`src/app/(public)` adalah **route group** — nama folder tidak muncul di URL.

## Dokumentasi teknis

Dokumentasi lengkap ada di **`docs/`** (path relatif dari file ini):

| File | Isi |
|:---|:---|
| `docs/README.md` | indeks + peta cepat + perintah |
| `docs/database-design.md` | desain DB: 5 tabel, relasi/FK, index, init vs migrasi |
| `docs/models-and-schema.md` | interface TS, konstanta domain, format hash password |
| `docs/api.md` | 4 endpoint: request/response, kode status, contoh curl |
| `docs/auth.md` | `/login`, cookie, sesi, hashing, alur redirect, proteksi API |
| `docs/throttling-pagination-filtering.md` | rate limit, `readFilters`/`readPage`, allowlist filter |
| `docs/unit-testing.md` | Vitest: `yarn test`, konfigurasi, cakupan 62 test, celah yang belum diuji |

Isinya ditulis dari pembacaan kode; pakai sebagai peta, lalu verifikasi ke
file sumbernya bila akan mengubah perilaku.

## Perintah

```bash
yarn install        # instal dependensi
yarn dev            # dev server lokal (port 3000)
yarn build          # build produksi
yarn start          # jalankan hasil build
yarn lint           # eslint — jalankan sebelum selesai
yarn test           # vitest run — unit test
yarn test:watch     # vitest mode watch
```

Docker (lihat `README.md` untuk detail):

```bash
docker compose up -d                                                  # dev
docker compose -f docker-compose.prod.yml up -d --build               # prod
docker compose -f docker-compose.prod.yml build frontend              # rebuild image saja
```

> **Penting:** di lingkungan ini port 3000 dilayani container **`west-frontend`** (compose
> prod), bukan `yarn dev`. `docker compose up` **tanpa** `--build` memakai image lama, jadi
> halaman/rute baru tidak akan muncul sampai image di-build ulang.

## Login, admin, dan alur redirect

- **Login:** `/login` — didefinisikan di `src/app/login/page.tsx`
- **Admin:** `/admin`, `/admin/kupon`, `/admin/pendaftaran`, `/admin/aktivitas` —
  proteksi ada di `src/app/admin/layout.tsx` yang memanggil `requireAdmin()`
- **Gerbang:** `src/lib/admin-auth.ts`
  - `requireAdmin()` → `redirect("/login")` bila tidak ada sesi
  - `getAdmin()` membaca cookie **`west_admin_session`** (token acak 64 hex, disimpan sebagai
    SHA-256 di tabel `west_admin_sessions`, ada masa berlaku)
  - `startAdminSession()` / `endAdminSession()` di `src/app/login/actions.ts`
- **Tidak ada `middleware.ts`** — proteksi murni per-layout/server component

Alur tanpa sesi (sudah terverifikasi):

```
GET  /admin        → 307 Location: /login     (berlaku juga untuk /admin/*)
GET  /login        → 200 form login
POST /login        → 303 Location: /admin + Set-Cookie: west_admin_session
GET  /admin (sesi) → 200 dashboard
GET  /login (sesi) → 307 Location: /admin     (sudah login, tidak bisa lihat form lagi)
POST /login (salah)→ 200 + pesan "Email atau kata sandi salah."
```

Logout: form `action={logout}` di `src/app/admin/layout.tsx` → `redirect("/login")`.

**Endpoint API vs halaman:** `/api/vouchers/generate` adalah *API* (butuh cookie sesi admin),
bukan halaman. Halaman login-nya hanya `/login`.

## Variabel lingkungan (nama saja, tanpa nilai)

Dipakai compose/app:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `NEXT_PUBLIC_ADMIN_WA_NUMBER` (wajib saat build prod)
- `MYSQL_ROOT_PASSWORD` (hanya docker-compose dev)

Dukungan login legacy (opsional, alternatif akun di DB):

- `WEST_ADMIN_EMAIL`, `WEST_ADMIN_PASSWORD_HASH`, `WEST_ADMIN_NAME`

Baca nama dari `README.md`; **jangan pernah** menampilkan isi `.env` atau nilainya.

## Akun admin

Sumber kebenaran: tabel `west_admin_accounts` (hash scrypt `salt:hash`). Cara mendapatkannya:

1. `scripts/seed-demo.mjs` — membuat 2 akun admin + data demo (idempoten). Kredensial demo
   tercantum di `README.md`. Karena compose prod tidak mem-publish port DB, jalankan dari host
   lewat container sekali pakai di network compose:
   ```bash
   docker run --rm --network west_west-internal-network --env-file .env \
     -v "$PWD":/repo -w /repo node:20-alpine node scripts/seed-demo.mjs
   ```
2. Hash manual + `WEST_ADMIN_EMAIL` / `WEST_ADMIN_PASSWORD_HASH` (lihat `README.md` bagian
   Portal Admin), lalu restart aplikasi.

## Migrasi DB

Volume DB yang sudah ada **tidak** menjalankan `database/init.sql` ulang. Jalankan manual:

```bash
docker exec -i west-mariadb sh -c 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' \
  < database/migrations/001_admin.sql
docker exec -i west-mariadb sh -c 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' \
  < database/migrations/002_admin_accounts.sql
```

DB baru cukup memakai `database/init.sql` (sudah termasuk tabel admin).

## Mendiagnosis rute 404 / routing serupa

1. **Pastikan yang melayani port itu siapa.** `ss -ltnp | grep :3000` atau
   `docker ps --format '{{.Names}} {{.Ports}}'`. Kalau ketemu `docker-proxy`, yang jalan adalah
   container — `yarn dev` lokal tidak berpengaruh.
2. **Cek umur image vs umur source.** `docker images --format '{{.Repository}} {{.CreatedSince}}'`
   dibandingkan `stat -c '%y %n' src/app/<rute>/page.tsx`. Image lebih tua dari file = rute
   belum pernah ikut ter-build → **`docker compose -f docker-compose.prod.yml up -d --build`**.
3. **Lihat rute yang benar-benar ada di container:**
   ```bash
   docker exec west-frontend sh -c 'ls /app/.next/server/app'
   ```
   Folder `login/`, `admin/` di situ = rute sudah ter-build; tidak ada = image basi.
4. **Bedakan 404 halaman dari 404 endpoint.** `curl -s -o /dev/null -w '%{http_code}\n' <url>`
   lalu bandingkan `/login` (halaman) dengan `/api/vouchers/generate` (API, balas 405/401 untuk
   GET). Halaman 404 + API hidup = masalah rute build, bukan server mati.
5. **Kalau redirect jalan tapi login gagal**, cek tabel admin dulu:
   `SHOW TABLES;` — kemungkinan migrasi belum dijalankan (lihat bagian Migrasi DB).
6. **Kalau seed/connect DB gagal dari host** dengan `ECONNREFUSED`: compose prod tidak
   mem-publish port DB. Jalankan proses di dalam network compose (contoh di bagian Akun admin),
   jangan menambah port ke compose tanpa perlu.
7. **Rate limit** ada di `src/lib/rate-limit.ts` (10/menit). Login memakai key global
   `west:admin:login` — terlalu banyak percobaan cepat memicu pesan "Terlalu banyak
   percobaan", bukan error server.

## Catatan perubahan lokal

`git status` saat ini berisi restrukturisasi yang belum di-commit: pemindahan halaman publik
ke `src/app/(public)/`, penambahan `src/app/login/`, `src/app/admin/`, `src/app/api/admin/`,
`src/lib/admin-auth.ts`, `src/lib/admin-data.ts`, `database/migrations/`, `scripts/`, plus
patch `west-admin-login.patch` dan `west-demo-data.patch`. Jangan dihapus atau ditimpa.
