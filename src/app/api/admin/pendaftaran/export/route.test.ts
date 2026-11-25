import { describe, expect, it } from "vitest";
import { csvCell } from "./route";

describe("csvCell — escaping & proteksi CSV injection", () => {
  it("membungkus semua nilai dengan kutip", () => {
    expect(csvCell("Budi")).toBe('"Budi"');
    expect(csvCell("")).toBe('""');
    expect(csvCell("0812 3456 7890")).toBe('"0812 3456 7890"');
  });

  it("melipatgandakan kutip di dalam nilai", () => {
    expect(csvCell('Nama "Budi"')).toBe('"Nama ""Budi"""');
  });

  it("mempertahankan baris biasa apa adanya", () => {
    expect(csvCell("Jl. Merdeka No. 1")).toBe('"Jl. Merdeka No. 1"');
    expect(csvCell("budi@mail.com")).toBe('"budi@mail.com"');
    expect(csvCell("-5")).toBe("\"'-5\""); // diawali tanda minus → ikut diproteksi
  });

  it("mencurigai formula di awal nilai", () => {
    expect(csvCell("=SUM(A1:A9)")).toBe('"\'=SUM(A1:A9)"');
    expect(csvCell("+1+1")).toBe('"\'+1+1"');
    expect(csvCell("@import")).toBe('"\'@import"');
    expect(csvCell("-2+3")).toBe('"\'-2+3"');
  });

  it("mencurigai whitespace/kontrol di awal yang diikuti formula", () => {
    expect(csvCell(" =1+1")).toBe('"\' =1+1"');
    expect(csvCell("\t=1+1")).toBe('"\'\t=1+1"');
    expect(csvCell("\n=1+1")).toBe('"\'\n=1+1"');
    expect(csvCell("\u0000=1+1")).toBe('"\'\u0000=1+1"');
  });

  it("tidak menandai nilai yang aman", () => {
    expect(csvCell("10")).toBe('"10"');
    expect(csvCell("West-ABC123")).toBe('"West-ABC123"');
    expect(csvCell("nama, dengan koma")).toBe('"nama, dengan koma"');
  });

  it("menggabungkan proteksi dengan lipatan kutip", () => {
    expect(csvCell('="a"')).toBe('"\'=""a"""');
  });
});
