import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Impor ulang modul supaya Map in-memory-nya kosong tiap test. */
async function freshRateLimit() {
  vi.resetModules();
  return import("./rate-limit");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("mengizinkan 10 request pertama lalu menolak", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 10; i++) {
      expect(rateLimit("kunci-a"), `request ke-${i + 1}`).toBe(true);
    }
    expect(rateLimit("kunci-a")).toBe(false);
    expect(rateLimit("kunci-a")).toBe(false);
  });

  it("memberi kuota terpisah per kunci", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 10; i++) rateLimit("ip-1");
    expect(rateLimit("ip-1")).toBe(false);
    expect(rateLimit("ip-2")).toBe(true);
  });

  it("membuka lagi window setelah 60 detik", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 10; i++) rateLimit("ip-1");
    expect(rateLimit("ip-1")).toBe(false);

    vi.advanceTimersByTime(59_000);
    expect(rateLimit("ip-1")).toBe(false); // masih dalam window

    vi.advanceTimersByTime(2_000); // total 61 detik → window baru
    // window baru tetap berkuota 10, dan panggilan reset sudah menghitung 1
    expect(rateLimit("ip-1")).toBe(true);
    for (let i = 0; i < 9; i++) expect(rateLimit("ip-1")).toBe(true);
    expect(rateLimit("ip-1")).toBe(false);
  });

  it("tidak menghitung lintas kunci saat window direset", async () => {
    const { rateLimit } = await freshRateLimit();
    for (let i = 0; i < 10; i++) rateLimit("ip-1");
    vi.advanceTimersByTime(61_000);
    expect(rateLimit("ip-1")).toBe(true);
    expect(rateLimit("ip-2")).toBe(true);
  });
});

describe("getClientIp", () => {
  it("membaca IP pertama dari x-forwarded-for", async () => {
    const { getClientIp } = await freshRateLimit();
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("mentrims spasi di sekitar IP", async () => {
    const { getClientIp } = await freshRateLimit();
    expect(getClientIp(new Headers({ "x-forwarded-for": "  203.0.113.7  " }))).toBe("203.0.113.7");
  });

  it("memakai nilai 'unknown' bila header tidak ada", async () => {
    const { getClientIp } = await freshRateLimit();
    expect(getClientIp(new Headers())).toBe("unknown");
  });

  it("mengabaikan header lain", async () => {
    const { getClientIp } = await freshRateLimit();
    expect(getClientIp(new Headers({ "user-agent": "curl/8", host: "localhost:3000" }))).toBe("unknown");
  });
});
