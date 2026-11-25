"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function VoucherForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const expires = form.get("expires");
    setPending(true);
    setError("");
    setCodes([]);
    try {
      const response = await fetch("/api/vouchers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlah: Number(form.get("jumlah")),
          discount_1bulan: Number(form.get("month")),
          discount_2minggu: Number(form.get("fortnight")),
          expires_at: expires ? new Date(`${expires}T23:59:59+07:00`).toISOString().slice(0, 19).replace("T", " ") : null,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setError(data.error || "Kupon belum bisa dibuat.");
        return;
      }
      setCodes(data.codes);
      router.refresh();
    } catch {
      setError("Kupon belum bisa diproses. Periksa koneksi dan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return <div className="west-create">
    <button className="west-button" type="button" aria-controls="voucher-form" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Tutup Form" : "+  Generate Kupon Baru"}</button>
    {open && <section id="voucher-form" className="west-card west-section">
      <h2>Kupon Baru</h2>
      <form onSubmit={submit} className="west-voucher-form">
        <label>Jumlah kupon<input name="jumlah" type="number" min="1" max="100" defaultValue="20" required /></label>
        <label>Diskon 1 bulan (Rp)<input name="month" type="number" min="0" max="250000" defaultValue="51000" required /></label>
        <label>Diskon 2 minggu (Rp)<input name="fortnight" type="number" min="0" max="165000" defaultValue="65000" required /></label>
        <label>Tenggat WIB (opsional)<input name="expires" type="date" /></label>
        <button className="west-button" disabled={pending}>{pending ? "Membuat kupon…" : "Buat Kupon"}</button>
      </form>
      {error && <p className="west-error" role="alert">{error}</p>}
      {codes.length > 0 && <div className="west-created" role="status"><b>{codes.length} kupon berhasil dibuat.</b><textarea aria-label="Kode kupon yang dibuat" readOnly value={codes.join("\n")} rows={Math.min(codes.length, 5)} /></div>}
    </section>}
  </div>;
}
