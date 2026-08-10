"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import AlertModal from "../../components/AlertModal";

const BASE_PROGRAMS = [
  "Kids / Month",
  "Teenager / Month",
  "Adult / Month",
  "Kids / 2 Weeks",
  "Teenager / 2 Weeks",
  "Adult / 2 Weeks"
];

const LEVELS = [
  "Pre basic",
  "Basic",
  "Intermediate",
  "Advance"
];

export default function PendaftaranForm() {
  const searchParams = useSearchParams();
  const programFromURL = searchParams.get("program");

  const [formData, setFormData] = useState({
    nama: "",
    ttl: "",
    alamat: "",
    wa: "",
    email: "",
    voucher: "",
  });

  const initialBase = programFromURL
    ? BASE_PROGRAMS.find((opt) => opt.toLowerCase() === programFromURL.toLowerCase()) || ""
    : "";

  const [baseProgram, setBaseProgram] = useState(initialBase);
  const [level, setLevel] = useState("");

  const harga = baseProgram.includes("Month") ? 250000 : baseProgram.includes("2 Weeks") ? 165000 : 0;
  const [diskon, setDiskon] = useState(0);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWaitingOpen, setIsWaitingOpen] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);


  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState("");
  const voucherTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setFormData({ ...formData, voucher: val });
    setDiskon(0);
    setVoucherMsg("");

    if (voucherTimeoutRef.current) clearTimeout(voucherTimeoutRef.current);

    if (!val) return;

    voucherTimeoutRef.current = setTimeout(async () => {
      setVoucherLoading(true);
      try {
        const res = await fetch("/api/validate-voucher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: val }),
        });
        const data = await res.json();
        if (data.valid) {
          const isMonth = baseProgram.includes("Month");
          const discAmount = isMonth ? data.discount_1bulan : data.discount_2minggu;
          setDiskon(discAmount || 0);
          setVoucherMsg(`Voucher valid! Potongan ${formatRupiah(discAmount)}`);
        } else {
          setDiskon(0);
          setVoucherMsg(data.error || "Voucher tidak valid");
        }
      } catch {
        setDiskon(0);
        setVoucherMsg("Gagal memvalidasi voucher");
      } finally {
        setVoucherLoading(false);
      }
    }, 600);
  };

  const totalHarga = Math.max(0, harga - diskon);
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const handlePreCheckout = () => {
    if (!formData.nama || !formData.ttl || !formData.alamat || !formData.wa || !formData.email || !baseProgram || !level) {
      setErrorMessage("Mohon lengkapi semua field formulir pendaftaran terlebih dahulu (kecuali voucher).");
      setIsErrorOpen(true);
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmYes = async () => {
    setIsConfirmOpen(false); 
    setIsWaitingOpen(true);  
    setCountdown(3);

    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.nama,
          ttl: formData.ttl,
          alamat: formData.alamat,
          email: formData.email,
          whatsapp: formData.wa,
          program: baseProgram,
          level,
          voucher_code: formData.voucher || undefined,
        }),
      });
    } catch {
      // proceed to WA even if save fails
    }

    let remaining = 3;
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setIsWaitingOpen(false);

        const programLengkap = `${baseProgram}, ${level}`;
        const pesanVoucher = formData.voucher && diskon > 0 ? `, pake voucher ${formData.voucher}` : "";
        const message = `Halo westmin, nama aku ${formData.nama} mau daftar kelas ${programLengkap}${pesanVoucher}. Langkah selanjutnya gimana ya?`;
        const adminWA = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "6285234567383";
        window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(message)}`, "_blank");

        setFormData({ nama: "", ttl: "", alamat: "", wa: "", email: "", voucher: "" });
        setBaseProgram("");
        setLevel("");
        setDiskon(0);
        setVoucherMsg("");
      }
    }, 1000);
  };

  return (
    <div className="relative bg-[#72c2b3]">
      <div className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 md:p-14 shadow-2xl max-w-3xl mx-auto w-[calc(100%-2rem)] sm:w-full my-6 sm:my-12 border border-gray-100">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-10 tracking-wide font-mono">
          Form Registrasi
        </h1>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">Nama</label>
            <input 
              type="text" 
              placeholder="Contoh: Fa'iz Maulana Habibi"
              className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors text-sm sm:text-base"
              value={formData.nama}
              onChange={(e) => setFormData({...formData, nama: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">Tempat & Tanggal Lahir</label>
            <input 
              type="text" 
              placeholder="Contoh: Semarang, 5 Maret 2000"
              className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors text-sm sm:text-base"
              value={formData.ttl}
              onChange={(e) => setFormData({...formData, ttl: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">Alamat</label>
            <textarea 
              rows={2}
              placeholder="Contoh: Jl. Cempaka No. 42A Tulungrejo - Pare - Kediri"
              className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors resize-none text-sm sm:text-base"
              value={formData.alamat}
              onChange={(e) => setFormData({...formData, alamat: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">No WhatsApp</label>
            <input 
              type="tel" 
              placeholder="Contoh: 0866548890"
              className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors text-sm sm:text-base"
              value={formData.wa}
              onChange={(e) => setFormData({...formData, wa: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">Email</label>
            <input 
              type="email" 
              placeholder="Contoh: rasberry987@gmail.com"
              className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors text-sm sm:text-base"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">Program Kelas</label>
            <select 
              className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors bg-white appearance-none text-sm sm:text-base"
              value={baseProgram}
              onChange={(e) => {
                setBaseProgram(e.target.value);
                setLevel(""); 
              }}
            >
              <option value="" disabled>Pilih Program Kelas</option>
              {BASE_PROGRAMS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {baseProgram && (
            <div>
              <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">
                Tingkatan (Level)
              </label>
              <select 
                className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors bg-white appearance-none text-sm sm:text-base"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="" disabled>Pilih Tingkatan Level</option>
                {LEVELS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[#1b7a70] font-semibold text-base sm:text-lg mb-1 sm:mb-2 block">Voucher (Optional)</label>
            <input 
              type="text" 
              placeholder="Masukkan kode voucher"
              className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:border-[#1b7a70] transition-colors uppercase text-sm sm:text-base"
              value={formData.voucher}
              onChange={handleVoucherChange}
            />
            {voucherLoading && <p className="text-xs sm:text-sm text-gray-500 mt-1">Memvalidasi voucher...</p>}
            {!voucherLoading && voucherMsg && (
              <p className={`text-xs sm:text-sm mt-1 ${diskon > 0 ? "text-green-600" : "text-red-500"}`}>{voucherMsg}</p>
            )}
          </div>

          <div className="mt-6 sm:mt-8 pt-4 pb-2 px-2 sm:px-4 md:px-8">
            <div className="flex justify-between text-base sm:text-lg font-bold text-black mb-2">
              <span>Harga</span>
              <span>{formatRupiah(harga)}</span>
            </div>
            <div className="flex justify-between text-base sm:text-lg font-bold text-black mb-4">
              <span>Voucher</span>
              <span>{diskon > 0 ? `- ${formatRupiah(diskon)}` : "-"}</span>
            </div>
            
            <hr className="border-t-[3px] border-black my-4" />
            
            <div className="flex justify-between text-lg sm:text-xl font-bold text-black">
              <span>Total</span>
              <span>{formatRupiah(totalHarga)}</span>
            </div>
          </div>

          <div className="border border-red-500 rounded-xl p-3 sm:p-4 my-6 sm:my-8 bg-white shadow-sm">
            <p className="text-red-500 text-center font-bold text-xs sm:text-[15px] leading-relaxed">
              Note : Klik tombol dibawah untuk membuat pesanan. Anda akan diarahkan ke WhatsApp Admin untuk mendapatkan nomor rekening dan petunjuk pembayaran manual.
            </p>
          </div>

          <button 
            onClick={handlePreCheckout}
            className="w-full sm:w-max sm:mx-auto block bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg shadow-md transition-colors text-sm sm:text-base"
          >
            Lanjutkan Pembayaran Via WA
          </button>
        </div>
      </div>

      <AlertModal 
        isConfirmOpen={isConfirmOpen}
        isWaitingOpen={isWaitingOpen}
        isErrorOpen={isErrorOpen}
        errorMessage={errorMessage}
        countdown={countdown}
        onConfirmYes={handleConfirmYes}
        onConfirmNo={() => setIsConfirmOpen(false)}
        onErrorClose={() => setIsErrorOpen(false)}
      />

    </div>
  );
}
