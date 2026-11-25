# Desain Database

Engine: **MariaDB 10.6**, `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`.
Didefinisikan di `database/init.sql` (database baru) dan
`database/migrations/*.sql` (database yang sudah ada).

Akses dari aplikasi melalui pool di `src/lib/db.ts`
(`connectionLimit: 10`, `waitForConnections: true`).

---

## 1. Relasi (ERD)

```
west_leads ──────< west_vouchers            (1 pendaftar memakai 0..1 voucher)
   id  ◄──────────── used_by_lead_id         ON DELETE SET NULL

west_admin_accounts ──< west_admin_sessions  (referensi logis, TANPA FK)
   id  ──────────────► admin_id

west_admin_activity   (berdiri sendiri, actor = email admin, string)
```

**Foreign key di database (diverifikasi lewat `information_schema`):**

| Kolom asal | Merujuk | On delete |
|:---|:---|:---|
| `west_vouchers.used_by_lead_id` | `west_leads.id` | `SET NULL` |

Itu **satu-satunya FK**. `west_admin_sessions.admin_id` hanyalah kolom `INT`
biasa — tidak ada constraint, sehingga penghapusan akun admin tidak otomatis
menghapus/menetralisir sesi.

---

## 2. Tabel

### 2.1 `west_leads` — data pendaftar

| Kolom | Tipe | Null | Default | Catatan |
|:---|:---|:---|:---|:---|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY |
| `nama` | VARCHAR(255) | NO | | di-sanitize (strip `<>`, trim, max 500) |
| `jenis_kelamin` | VARCHAR(20) | NO | | |
| `umur` | INT | NO | | di-clamp 1–100 saat insert |
| `ttl` | VARCHAR(255) | NO | | tempat, tanggal lahir |
| `alamat` | TEXT | NO | | |
| `whatsapp` | VARCHAR(30) | NO | | divalidasi regex `^[0-9+\-\s()]{7,20}$` |
| `email` | VARCHAR(255) | NO | | **tidak unik**, tidak ada index |
| `program` | VARCHAR(100) | NO | | format `"<Kategori> / <Durasi>"` |
| `level` | VARCHAR(50) | NO | | salah satu dari `Pre basic`, `Basic`, `Intermediate`, `Advance` |
| `voucher_code` | VARCHAR(50) | YES | NULL | **salinan** kode, bukan FK |
| `discount_amount` | INT | YES | 0 | nominal potongan yang dipakai |
| `total_bayar` | INT | NO | | `max(0, hargaDasar − diskon)` |
| `status_bayar` | VARCHAR(20) | YES | `'Pending'` | tidak ada constraint/enum di DB |
| `created_at` | TIMESTAMP | YES | `CURRENT_TIMESTAMP` | dipakai untuk urutan & grafik tren |

Index: hanya `PRIMARY (id)`.

### 2.2 `west_vouchers` — kupon

| Kolom | Tipe | Null | Default | Catatan |
|:---|:---|:---|:---|:---|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY |
| `code` | VARCHAR(50) | NO | | **UNIQUE** — format `WEST-XXXXXXXX` |
| `discount_1bulan` | INT | NO | 51000 | potongan program `* Month` |
| `discount_2minggu` | INT | NO | 65000 | potongan program `* 2 Weeks` |
| `expires_at` | DATETIME | YES | NULL | `NULL` = tidak pernah kedaluwarsa |
| `is_used` | TINYINT(1) | YES | 0 | 0 = tersedia, 1 = terpakai |
| `used_by_lead_id` | INT | YES | NULL | FK → `west_leads.id` ON DELETE SET NULL |
| `used_at` | DATETIME | YES | NULL | diisi saat pendaftaran memakai voucher |
| `created_at` | TIMESTAMP | YES | `CURRENT_TIMESTAMP` | |

Index: `PRIMARY (id)`, `UNIQUE (code)`, `INDEX (used_by_lead_id)`.

Status voucher **tidak disimpan sebagai kolom** — dihitung saat query
(`src/lib/admin-data.ts`):

```sql
CASE WHEN is_used = 1 THEN 'used'
     WHEN expires_at <= NOW() THEN 'expired'
     ELSE 'available' END
```

### 2.3 `west_admin_accounts` — akun admin

| Kolom | Tipe | Null | Default | Catatan |
|:---|:---|:---|:---|:---|
| `id` | INT | NO | AUTO_INCREMENT | PRIMARY KEY |
| `email` | VARCHAR(255) | NO | | **UNIQUE** |
| `name` | VARCHAR(100) | NO | | ditampilkan di topbar dashboard |
| `password_hash` | VARCHAR(161) | NO | | format `salt(32 hex):hash(128 hex)` |

Index: `PRIMARY (id)`, `UNIQUE (email)`.

### 2.4 `west_admin_sessions` — sesi login

| Kolom | Tipe | Null | Default | Catatan |
|:---|:---|:---|:---|:---|
| `token_hash` | CHAR(64) | NO | | PRIMARY KEY — **SHA-256 dari token**, bukan token asli |
| `expires_at` | DATETIME | NO | | diindex; dibersihkan saat login |
| `admin_id` | INT | YES | NULL | nullable; tidak ada FK |
| `legacy_email` | VARCHAR(255) | YES | NULL | diisi hanya bila login memakai fallback env |

Index: `PRIMARY (token_hash)`, `INDEX (expires_at)`.

Ditambahkan oleh `database/migrations/001_admin.sql`
(`token_hash`, `expires_at`) dan `002_admin_accounts.sql`
(`admin_id`, `legacy_email`).

### 2.5 `west_admin_activity` — log aktivitas

| Kolom | Tipe | Null | Default | Catatan |
|:---|:---|:---|:---|:---|
| `id` | BIGINT | NO | AUTO_INCREMENT | PRIMARY KEY |
| `actor` | VARCHAR(255) | NO | | email admin (string, bukan FK) |
| `action` | VARCHAR(32) | NO | | `login`, `logout`, `vouchers` |
| `description` | VARCHAR(255) | NO | | teks human-readable |
| `created_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | |

Index: hanya `PRIMARY (id)`.

Nilai `action` yang diizinkan didefinisikan di `src/lib/admin-data.ts`
(`export const actions`).

---

## 3. Skrip SQL

| File | Peran | Kapan dipakai |
|:---|:---|:---|
| `database/init.sql` | Membuat **semua** tabel (termasuk tabel admin) | Database baru — dijalankan image `west-db` saat pertama kali |
| `database/migrations/001_admin.sql` | `west_admin_sessions` + `west_admin_activity` | Volume DB lama |
| `database/migrations/002_admin_accounts.sql` | `west_admin_accounts` + `ALTER sessions` | Volume DB lama, **setelah** 001 |

> Volume MariaDB yang sudah terisi **tidak** menjalankan `init.sql` ulang.
> Jalankan migrasi manual — perintahnya ada di `AGENTS.md` bagian *Migrasi DB*.

Urutan wajib: `001` → `002` (002 melakukan `ALTER TABLE west_admin_sessions`).

---

## 4. Observasi desain (bukan bug, tapi perlu diketahui)

Temuan berikut dari pembacaan skrip & `information_schema`, bukan keluhan:

1. **`west_leads.email` tidak unik dan tidak terindex** — pendaftar yang sama
   bisa mendaftar berkali-kali, dan pencarian `LOCATE(email)` akan full scan.
2. **`west_vouchers` ↔ `west_leads` lewat salinan `voucher_code`** di tabel
   leads, bukan FK. Jika kode voucher berubah, kolom `voucher_code` di leads
   tidak ikut berubah (tidak ada mekanisme update di kode).
3. **`west_admin_sessions.admin_id` tanpa FK** — penghapusan akun tidak
   meniadakan sesinya; aplikasi menangani hal ini dengan join ke akun saat
   membaca sesi (lihat `auth.md`).
4. **`status_bayar` tanpa constraint** — aplikasi selalu menulis `'Pending'`
   saat insert; perubahan status dilakukan di luar jalur yang terlihat di kode.
5. **Tidak ada index pada `created_at`** — semua daftar urut
   `ORDER BY created_at DESC, id DESC`, jadi sorting pakai index PK tidak
   terpakai penuh. Dampak kecil pada volume data saat ini.
