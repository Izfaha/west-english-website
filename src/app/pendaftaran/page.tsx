import { Suspense } from "react";
import PendaftaranForm from "./PendaftaranForm";

export default function PendaftaranPage() {
  return (
    // 'flex flex-col' mencegah margin collapse (celah putih).
    // 'pt-20 md:pt-28' memberi jarak ideal dari Navbar.
    // 'pb-20 md:pb-32' memberi jarak ideal dari Footer.
    <main className="min-h-screen bg-[#72c2b3] flex flex-col items-center pt-20 md:pt-28 pb-20 md:pb-32 px-4 sm:px-6 w-full">
      
      <Suspense fallback={
        <div className="flex justify-center items-center h-64 text-white text-xl font-bold">
          Memuat Form Registrasi...
        </div>
      }>
        <PendaftaranForm />
      </Suspense>

    </main>
  );
}