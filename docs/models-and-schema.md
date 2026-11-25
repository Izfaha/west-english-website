# Model & Schema

Aplikasi ini **tidak memakai ORM**. Model hanya berupa interface TypeScript di
atas row `mysql2`, plus konstanta domain yang memvalidasi input.

---

## 1. Tipe data (model aplikasi)

### 1.1 `src/lib/admin-data.ts`

Semua interface `extends RowDataPacket` (mysql2) sehingga bisa dipakai
sebagai generic pada `pool.execute<T[]>`.

```ts
export interface Lead extends RowDataPacket {
  id: number; nama: string; email: string; whatsapp: string;
  program: string; created_at: Date;
}

export interface Voucher extends RowDataPacket {
  id: number; code: string; discount_1bulan: number; discount_2minggu: number;
  created_at: Date; expires_at: Date | null; used_at: Date | null;
  status: keyof typeof voucherStatuses;   // 'available' | 'used' | 'expired'
}

export interface Activity extends RowDataPacket {
  id: number; actor: string; action: keyof typeof actions;
  description: string; created_at: Date;
}
```

> **Perhatian:** `Lead` hanya memetakan 6 kolom dari `west_leads`
> (`id, nama, email, whatsapp, program, created_at`) — kolom lain
> (`umur`, `ttl`, `alamat`, `discount_amount`, `total_bayar`, `status_bayar`,
> `voucher_code`, `level`) memang tidak ikut di-`SELECT` untuk daftar.

### 1.2 `src/lib/admin-auth.ts`

```ts
interface Admin {
  id: number | null;   // null = akun dari fallback env legacy
  email: string;
  name: string;
}
```

### 1.3 Filter

```ts
export type Search = Record<string, string | string[] | undefined>;   // searchParams Next.js
type Filters = ReturnType<typeof readFilters>;                        // hasil normalisasi
```

`readFilters()` menghasilkan `{ limit, page, query, filter }` — detail di
[throttling-pagination-filtering.md](throttling-pagination-filtering.md).

---

## 2. Konstanta domain

### Program & harga (`src/app/api/register/route.ts`)

```ts
const PRICE_MAP: Record<string, number> = {
  "Kids / Month": 250000,   "Teenager / Month": 250000,   "Adult / Month": 250000,
  "Kids / 2 Weeks": 165000, "Teenager / 2 Weeks": 165000, "Adult / 2 Weeks": 165000,
};

const VALID_LEVELS = ["Pre basic", "Basic", "Intermediate", "Advance"];
```

`PRICE_MAP` adalah **satu-satunya sumber kebenaran harga dasar** — kunci-nya
harus persis sama dengan format kolom `program` di `west_leads`.

### Kategori program (`src/lib/admin-data.ts`)

```ts
export const programs = ["Kids", "Teenager", "Adult"];
```

Dipakai untuk filter daftar pendaftaran. Nilai diambil dari
`SUBSTRING_INDEX(program, ' / ', 1)` — yaitu bagian sebelum `" / "`.

### Status kupon & aksi log (`src/lib/admin-data.ts`)

```ts
export const voucherStatuses = { available: "Belum Digunakan", used: "Sudah Digunakan", expired: "Kedaluwarsa" };
export const actions         = { login: "Login", logout: "Logout", vouchers: "Buat Kupon" };
```

Kunci objek = nilai tersimpan di DB; nilai = label tampilan di UI.

---

## 3. Pemetaan skrip SQL → tipe

| Tabel | Kolom | Tipe TS | Dikonsumsi oleh |
|:---|:---|:---|:---|
| `west_leads` | `id`, `nama`, `email`, `whatsapp`, `program`, `created_at` | `Lead` | `listLeads`, `exportLeads`, `LeadsTable` |
| `west_leads` | `total_bayar`, `discount_amount` | `number` | respons `POST /api/register` |
| `west_vouchers` | semua kolom + `status` | `Voucher` | `listVouchers` (status dihitung via `CASE`) |
| `west_admin_activity` | `id`, `actor`, `action`, `description`, `created_at` | `Activity` | `listActivity` |
| `west_admin_accounts` | `id`, `email`, `name` | `Admin` | `getAdmin`, `verifyAdminCredentials` |
| `west_admin_sessions` | `token_hash`, `expires_at`, `admin_id`, `legacy_email` | row biasa | `getAdmin` (query join) |

---

## 4. Model harga & diskon

```
hargaDasar   = PRICE_MAP[program]                    // 250000 (Month) atau 165000 (2 Weeks)
diskon       = program.includes("Month")
                 ? voucher.discount_1bulan
                 : voucher.discount_2minggu          // 0 bila voucher tidak valid
total_bayar  = max(0, hargaDasar − diskon)
```

Voucher dianggap **layak** hanya bila ketiganya terpenuhi
(`src/app/api/register/route.ts`):

1. kode ditemukan di `west_vouchers` (setelah `trim().toUpperCase()`),
2. `expires_at` kosong **atau** `now ≤ expires_at`,
3. `is_used` falsy.

Bila query voucher gagal (exception), kode **diam-diam lanjut tanpa diskon**
(blok `catch` kosong) — pendaftaran tetap tersimpan.

Setelah insert berhasil dan voucher layak, voucher ditandai:

```sql
UPDATE west_vouchers SET is_used = 1, used_by_lead_id = ?, used_at = NOW() WHERE id = ?
```

---

## 5. Format hash password

`password_hash` (`VARCHAR(161)`):

```
<salt 32 hex>:<hash 128 hex>
 16 byte       64 byte
 scrypt(password, salt, keylen=64)
```

Regex validasi di `src/lib/admin-auth.ts`:

```
/^[a-f0-9]{32}:[a-f0-9]{128}$/
```

32 + 1 + 128 = **161** — pas dengan panjang kolom.
Generator hash ada di `scripts/seed-demo.mjs` dan di bagian *Portal Admin* `README.md`.
