# Unit Testing

Infra test **sudah ada** dan berjalan: **Vitest 5.1.2** dengan **6 file test /
62 test — semuanya lulus** (diverifikasi `yarn test`, Nov 2026).

---

## 1. Menjalankan

```bash
yarn test         # vitest run — sekali jalan, exit code ≠ 0 bila ada gagal
yarn test:watch   # vitest — mode watch untuk pengembangan
```

Perintah lain:

```bash
yarn test --reporter=verbose   # daftar tiap test
yarn test admin-data           # hanya file yang cocok pola
```

Status pemeriksaan terakhir:

| Perintah | Status | Cakupan |
|:---|:---|:---|
| `yarn test` | ✅ 6 file / 62 test lulus | logika murni + query SQL (dimock) |
| `yarn lint` | ✅ lulus | style/ESLint |
| `yarn build` | ✅ lulus | kompilasi TS + prerender 15 rute |

---

## 2. Konfigurasi

File: **`vitest.config.mts`** (`.mts` — mencegah peringatan ESM-dimuat-sebagai-CJS).

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },  // tiru tsconfig `@/*`
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
  },
});
```

Catatan:

- **Alias `@/` wajib** — banyak modul memakai import `@/lib/...`.
- **`import.meta.dirname`**, bukan `__dirname` (tidak ada di ESM).
- Environment `node` — tidak ada DOM; test berjalan tanpa browser.
- `clearMocks: true` — mock otomatis dibersihkan antar test.
- Dependensi: `vitest` + `vite` (peer dependency; tanpa `vite` gagal dengan
  `ERR_MODULE_NOT_FOUND ... 'vite'`).

---

## 3. Cakupan per file

| File | Test | Yang diuji |
|:---|---:|:---|
| `src/lib/admin-data.test.ts` | 20 | `readFilters` (default, clamp limit/page, trim+potong query, array), konstanta domain (`programs`, `voucherStatuses`, `actions`), `recordActivity` (db disuntikkan), `listLeads` (COUNT→clamp page→OFFSET, WHERE `LOCATE`, allowlist filter, `ORDER BY`) |
| `src/app/api/vouchers/generate/route.test.ts` | 10 | `generateCode` (format `WEST-XXXXXXXX`, alfabet tanpa `O/0/I/1`, unik 500 kode), `validExpiry` (format, tanggal tak nyata, tahun < 1000) |
| `src/app/admin/ui.test.ts` | 9 | `formatCount`, `formatMoney`, `formatDate` (zona Asia/Jakarta, `null`→`—`), `formatDateTime`, `filterUrl` (encoding, `page` opsional) |
| `src/lib/rate-limit.test.ts` | 8 | `rateLimit` (kuota 10/window, key terpisah, reset 60 dtk via fake timer), `getClientIp` (XFF pertama, trim, fallback `unknown`) |
| `src/app/api/register/route.test.ts` | 8 | `sanitize` (strip `<>`, trim, max 500), `PRICE_MAP` (6 kombinasi, 2 titik harga), `VALID_LEVELS` (4 level) |
| `src/app/api/admin/pendaftaran/export/route.test.ts` | 7 | `csvCell` — escaping kutip `""` + **anti CSV injection** (awalan `= + @ -` & kontrol diberi `'`) |

### Pola yang dipakai

- **Mock pool DB** via `vi.mock("@/lib/db", ...)` + `vi.hoisted` untuk
  `admin-data.test.ts` — dua `resolve` berurutan (COUNT lalu SELECT).
- **Fake timer + `vi.resetModules()`** untuk `rate-limit.test.ts` — state
  `Map` tingkat modul, jadi modul diimpor ulang tiap test.
- **Tanpa DB nyata, tanpa HTTP** — semua test adalah unit test murni.

---

## 4. Yang belum dicakup

| Belum diuji | Alasan / hambatan |
|:---|:---|
| `getAdmin`, `requireAdmin`, `startAdminSession`, `endAdminSession` | baca/tulis `cookies()` Next.js + query DB |
| `verifyAdminCredentials` | scrypt + query DB (bisa dengan mock pool) |
| Alur route handler penuh (`POST`/`GET`) | perlu mock `getPool` menyeluruh + mock `cookies()`/`NextRequest` |
| Halaman server (`page.tsx`, `admin/layout.tsx`) | server component + `redirect()` |
| Server action `login`/`logout` | gabungan cookies + rate limit + DB |
| Integrasi DB nyata (schema, FK, migrasi) | butuh compose dev DB terpisah |

Prioritas bila menambah test: (1) validasi & perhitungan `POST /api/register`
(terlibat uang), (2) urutan cek `POST /api/validate-voucher`,
(3) cek 401/415/403/429/400 `POST /api/vouchers/generate`.

---

## 5. Catatan saat menulis test baru

1. **Helper privat perlu `export` dulu.** Sudah dilakukan tanpa mengubah
   perilaku untuk: `generateCode`, `validExpiry`, `csvCell`, `PRICE_MAP`,
   `VALID_LEVELS`, `sanitize`. Pola yang sama berlaku untuk helper baru.
2. **`rate-limit.ts` tidak punya fungsi reset** — pakai pola
   `vi.resetModules()` + `await import("./rate-limit")`.
3. **`readPage()`/`listLeads` menghasilkan 2 query** — siapkan dua
   `mockResolvedValueOnce`.
4. **`recordActivity()` menerima param `db` default** — tinggal injeksi mock.
5. **Waktu.** `expires_at` dibandingkan `NOW()` — pakai `vi.setSystemTime`
   bila menguji kedaluwarsa.
6. **Rate limit mengganggu uji HTTP beruntun** — pakai key/IP berbeda atau
   tunggu window 60 detik.
