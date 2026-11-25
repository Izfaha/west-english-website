import { beforeEach, describe, expect, it, vi } from "vitest";
import { actions, listLeads, programs, readFilters, recordActivity, voucherStatuses } from "./admin-data";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("@/lib/db", () => ({ getPool: () => ({ execute }) }));

beforeEach(() => execute.mockReset());

describe("readFilters — normalisasi parameter query", () => {
  it("memberi default saat parameter kosong", () => {
    expect(readFilters({})).toEqual({ limit: 10, page: 1, query: "", filter: "" });
  });

  it("hanya menerima limit 10, 25, 50 — selain itu kembali ke 10", () => {
    expect(readFilters({ limit: "10" }).limit).toBe(10);
    expect(readFilters({ limit: "25" }).limit).toBe(25);
    expect(readFilters({ limit: "50" }).limit).toBe(50);
    expect(readFilters({ limit: "999" }).limit).toBe(10);
    expect(readFilters({ limit: "0" }).limit).toBe(10);
    expect(readFilters({ limit: "-10" }).limit).toBe(10);
    expect(readFilters({ limit: "25.5" }).limit).toBe(10);
    expect(readFilters({ limit: "" }).limit).toBe(10);
    expect(readFilters({ limit: undefined }).limit).toBe(10);
  });

  it("membatasi page minimal 1", () => {
    expect(readFilters({ page: "0" }).page).toBe(1);
    expect(readFilters({ page: "-5" }).page).toBe(1);
    expect(readFilters({ page: "abc" }).page).toBe(1);
    expect(readFilters({ page: undefined }).page).toBe(1);
  });

  it("membatasi page maksimal 100000", () => {
    expect(readFilters({ page: "9999999" }).page).toBe(100000);
    expect(readFilters({ page: "100000" }).page).toBe(100000);
  });

  it("membuang bagian desimal pada page", () => {
    expect(readFilters({ page: "3.7" }).page).toBe(3);
    expect(readFilters({ page: "3.2" }).page).toBe(3);
  });

  it("menangani array (multi-value) sebagai string kosong", () => {
    expect(readFilters({ q: ["a", "b"] }).query).toBe("");
    expect(readFilters({ filter: ["a"] }).filter).toBe("");
  });

  it("trim query dan potong maksimal 100 karakter", () => {
    expect(readFilters({ q: "  budi  " }).query).toBe("budi");
    expect(readFilters({ q: "x".repeat(300) }).query).toHaveLength(100);
    expect(readFilters({ q: "x".repeat(100) }).query).toHaveLength(100);
    expect(readFilters({ q: "x".repeat(99) }).query).toHaveLength(99);
  });

  it("filter diteruskan apa adanya (validasi allowlist ada di pemakainya)", () => {
    expect(readFilters({ filter: "Kids" }).filter).toBe("Kids");
    expect(readFilters({ filter: "apapun" }).filter).toBe("apapun");
  });
});

describe("konstanta domain", () => {
  it("memiliki tiga kategori program", () => {
    expect(programs).toEqual(["Kids", "Teenager", "Adult"]);
  });

  it("memiliki tiga status kupon dengan label Indonesia", () => {
    expect(Object.keys(voucherStatuses)).toEqual(["available", "used", "expired"]);
    expect(voucherStatuses).toEqual({
      available: "Belum Digunakan",
      used: "Sudah Digunakan",
      expired: "Kedaluwarsa",
    });
  });

  it("memiliki tiga aksi log", () => {
    expect(Object.keys(actions)).toEqual(["login", "logout", "vouchers"]);
  });
});

describe("recordActivity", () => {
  it("menulis ke db yang disuntikkan, bukan pool global", async () => {
    const db = { execute: vi.fn().mockResolvedValue([{}, []]) };
    await recordActivity("faiz.admin@west.test", "login", "Admin masuk ke dashboard.", db as never);

    expect(db.execute).toHaveBeenCalledTimes(1);
    expect(db.execute).toHaveBeenCalledWith(
      "INSERT INTO west_admin_activity (actor, action, description) VALUES (?, ?, ?)",
      ["faiz.admin@west.test", "login", "Admin masuk ke dashboard."],
    );
  });

  it("meneruskan error dari db (tanpa menelannya)", async () => {
    const db = { execute: vi.fn().mockRejectedValue(new Error("db mati")) };
    await expect(recordActivity("a@b.c", "logout", "x", db as never)).rejects.toThrow("db mati");
  });
});

describe("listLeads — pagination & filtering (pool dimock)", () => {
  it("menghitung total lalu mengambil halaman dengan OFFSET yang benar", async () => {
    execute
      .mockResolvedValueOnce([[{ total: "25" }], []])
      .mockResolvedValueOnce([[], []]);

    const { page, total, rows } = await listLeads(readFilters({ page: "99", limit: "10" }));

    // 25 baris / 10 per halaman = 3 halaman → page 99 ditarik jadi 3
    expect(total).toBe(25);
    expect(page).toBe(3);
    expect(rows).toEqual([]);

    const [, params] = execute.mock.calls[1] as [string, unknown[]];
    expect(params).toEqual([10, 20]); // limit, (3-1)*10
  });

  it("menghitung offset halaman pertama", async () => {
    execute
      .mockResolvedValueOnce([[{ total: "55" }], []])
      .mockResolvedValueOnce([[], []]);

    const { page } = await listLeads(readFilters({ page: "1", limit: "25" }));
    expect(page).toBe(1);

    const [, params] = execute.mock.calls[1] as [string, unknown[]];
    expect(params).toEqual([25, 0]);
  });

  it("menarik page melebihi batas ke halaman terakhir", async () => {
    execute
      .mockResolvedValueOnce([[{ total: "3" }], []])
      .mockResolvedValueOnce([[], []]);

    const { page } = await listLeads(readFilters({ page: "500" }));
    expect(page).toBe(1); // ceil(3/10) = 1
  });

  it("membangun WHERE dari query pencarian pada nama dan email", async () => {
    execute
      .mockResolvedValueOnce([[{ total: "0" }], []])
      .mockResolvedValueOnce([[], []]);

    await listLeads(readFilters({ q: "budi" }));

    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("COUNT(*)");
    expect(sql).toContain("LOCATE(?, nama)");
    expect(sql).toContain("LOCATE(?, email)");
    expect(params).toEqual(["budi", "budi"]);
  });

  it("menerapkan allowlist filter kategori program", async () => {
    execute
      .mockResolvedValueOnce([[{ total: "0" }], []])
      .mockResolvedValueOnce([[], []]);

    await listLeads(readFilters({ filter: "Kids" }));

    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("SUBSTRING_INDEX(program, ' / ', 1) = ?");
    expect(params).toContain("Kids");
  });

  it("mengabaikan filter di luar allowlist", async () => {
    execute
      .mockResolvedValueOnce([[{ total: "0" }], []])
      .mockResolvedValueOnce([[], []]);

    await listLeads(readFilters({ filter: "Hacker" }));

    const [sql] = execute.mock.calls[0] as [string];
    expect(sql).not.toContain("SUBSTRING_INDEX(program, ' / ', 1) = ?");
  });

  it("selalu mengurutkan created_at DESC, id DESC", async () => {
    execute
      .mockResolvedValueOnce([[{ total: "0" }], []])
      .mockResolvedValueOnce([[], []]);

    await listLeads(readFilters({}));

    const [sql] = execute.mock.calls[1] as [string];
    expect(sql).toContain("ORDER BY created_at DESC, id DESC");
  });
});
