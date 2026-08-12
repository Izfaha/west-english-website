import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#72c2b3]">
      
      <section className="relative w-full h-[45vh] sm:h-[50vh] md:h-[550px]">
        <Image
          src="/images/homepage-top.webp"
          alt="Siswa WEST Kampung Inggris"
          fill
          priority
          className="object-cover"
        />
        
        <div className="absolute -bottom-10 sm:-bottom-12 left-4 sm:left-6 md:left-20 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-[#f2790f] rounded-full flex items-center justify-center text-white font-bold text-center p-4 sm:p-6 shadow-xl z-20 border-4 border-[#72c2b3]">
          <p className="text-xs sm:text-[15px] md:text-lg leading-snug">
            Dapatkan Potongan Harga dengan VOUCHER
          </p>
        </div>
      </section>

      <section className="bg-white py-4 sm:py-6 relative z-10 w-full overflow-hidden shadow-sm">
        <div className="animate-marquee whitespace-nowrap">
          <span className="text-[#1b7a70] text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide px-8 sm:px-16 md:px-24">
            Let&apos;s learn with WEST Kampung Inggris
          </span>
          <span className="hidden sm:inline text-[#1b7a70] text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide px-8 sm:px-16 md:px-24">
            Let&apos;s learn with WEST Kampung Inggris
          </span>
          <span className="hidden sm:inline text-[#1b7a70] text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide px-8 sm:px-16 md:px-24">
            Let&apos;s learn with WEST Kampung Inggris
          </span>
          <span className="hidden sm:inline text-[#1b7a70] text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide px-8 sm:px-16 md:px-24">
            Let&apos;s learn with WEST Kampung Inggris
          </span>
        </div>
      </section>

      {/* ========== Kelas Online Reguler ========== */}
      <section id="program" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-24">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-8 sm:mb-12 pb-2 tracking-wide drop-shadow-md bg-gradient-to-r from-white via-amber-300 to-white bg-clip-text text-transparent">
          Kelas Online Reguler
        </h2>
        
        {/* kelas Kids / Month*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-[#eef8f6] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg border-b-8 border-white">
            <h3 className="text-[#1b7a70] text-xl sm:text-2xl font-bold mb-2">Kids / Month</h3>
            <p className="text-[#f2790f] text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Rp.250,000</p>
            <div className="text-[#2d4a46] space-y-1 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
              <p>E-Modul</p>
              <p>20x virtual meeting</p>
              <p>Pre basic/Basic/</p>
              <p>Intermediate/Advance</p>
              <p>Speaking Skill</p>
              <p>Spoken Structure</p>
              <p>max. 10 students</p>
              <p>E-Certificate</p>
            </div>
            <Link href="/pendaftaran" className="mt-auto bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold px-8 sm:px-10 py-2.5 rounded-lg shadow-md transition-colors">
              Daftar
            </Link>
          </div>

          {/* kelas Teenager / Month*/}
          <div className="bg-[#eef8f6] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg border-b-8 border-white">
            <h3 className="text-[#1b7a70] text-xl sm:text-2xl font-bold mb-2">Teenager / Month</h3>
            <p className="text-[#f2790f] text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Rp.250,000</p>
            <div className="text-[#2d4a46] space-y-1 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
              <p>E-Modul</p>
              <p>20x virtual meeting</p>
              <p>Pre basic/Basic/</p>
              <p>Intermediate/Advance</p>
              <p>Speaking Skill</p>
              <p>Spoken Structure</p>
              <p>max. 10 students</p>
              <p>E-Certificate</p>
            </div>
            <Link href="/pendaftaran" className="mt-auto bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold px-8 sm:px-10 py-2.5 rounded-lg shadow-md transition-colors">
              Daftar
            </Link>
          </div>

          {/* kelas  Adult / Month*/}
          <div className="bg-[#eef8f6] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg border-b-8 border-white">
            <h3 className="text-[#1b7a70] text-xl sm:text-2xl font-bold mb-2">Adult / Month</h3>
            <p className="text-[#f2790f] text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Rp.250,000</p>
            <div className="text-[#2d4a46] space-y-1 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
              <p>E-Modul</p>
              <p>20x virtual meeting</p>
              <p>Pre basic/Basic/</p>
              <p>Intermediate/Advance</p>
              <p>Speaking Skill</p>
              <p>Spoken Structure</p>
              <p>max. 10 students</p>
              <p>E-Certificate</p>
            </div>
            <Link href="/pendaftaran" className="mt-auto bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold px-8 sm:px-10 py-2.5 rounded-lg shadow-md transition-colors">
              Daftar
            </Link>
          </div>
        </div>
      </section>

      {/* ========== Kelas Online Private ========== */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto mb-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-8 sm:mb-12 pb-2 tracking-wide drop-shadow-md bg-gradient-to-r from-white via-amber-300 to-white bg-clip-text text-transparent">
          Kelas Online Private
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-[#eef8f6] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg border-b-8 border-white">
            <h3 className="text-[#1b7a70] text-xl sm:text-2xl font-bold mb-2">Kids / 2 Weeks</h3>
            <p className="text-[#f2790f] text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Rp.165,000</p>
            <div className="text-[#2d4a46] space-y-1 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
              <p>E-Modul</p>
              <p>10x virtual meeting</p>
              <p>Pre basic/Basic/</p>
              <p>Intermediate/Advance</p>
              <p>Speaking Skill</p>
              <p>Spoken Structure</p>
              <p>max. 10 students</p>
              <p>E-Certificate</p>
            </div>
            <Link href="/pendaftaran" className="mt-auto bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold px-8 sm:px-10 py-2.5 rounded-lg shadow-md transition-colors">
              Daftar
            </Link>
          </div>

          <div className="bg-[#eef8f6] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg border-b-8 border-white">
            <h3 className="text-[#1b7a70] text-xl sm:text-2xl font-bold mb-2">Teenager / 2 Weeks</h3>
            <p className="text-[#f2790f] text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Rp.165,000</p>
            <div className="text-[#2d4a46] space-y-1 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
              <p>E-Modul</p>
              <p>10x virtual meeting</p>
              <p>Pre basic/Basic/</p>
              <p>Intermediate/Advance</p>
              <p>Speaking Skill</p>
              <p>Spoken Structure</p>
              <p>max. 10 students</p>
              <p>E-Certificate</p>
            </div>
            <Link href="/pendaftaran" className="mt-auto bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold px-8 sm:px-10 py-2.5 rounded-lg shadow-md transition-colors">
              Daftar
            </Link>
          </div>

          <div className="bg-[#eef8f6] rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg border-b-8 border-white">
            <h3 className="text-[#1b7a70] text-xl sm:text-2xl font-bold mb-2">Adult / 2 Weeks</h3>
            <p className="text-[#f2790f] text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Rp.165,000</p>
            <div className="text-[#2d4a46] space-y-1 mb-6 sm:mb-8 font-medium text-sm sm:text-base">
              <p>E-Modul</p>
              <p>10x virtual meeting</p>
              <p>Pre basic/Basic/</p>
              <p>Intermediate/Advance</p>
              <p>Speaking Skill</p>
              <p>Spoken Structure</p>
              <p>max. 10 students</p>
              <p>E-Certificate</p>
            </div>
            <Link href="/pendaftaran" className="mt-auto bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold px-8 sm:px-10 py-2.5 rounded-lg shadow-md transition-colors">
              Daftar
            </Link>
          </div>
        </div>
      </section>

      <section 
        className="bg-[#65b0a3] pt-20 sm:pt-28 pb-24 sm:pb-32 px-4 sm:px-6" 
        style={{ clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-center mb-6 sm:mb-8 pb-2 bg-gradient-to-r from-[#135c52] via-[#0b332d] to-[#135c52] bg-clip-text text-transparent">
            WEST Kampung Inggris
          </h2>
          <p className="text-black text-base sm:text-lg md:text-xl leading-relaxed text-justify md:text-center">
            WEST Kampung Inggris WEST adalah sebuah lembaga kursus dan
            pelatihan Bahasa Inggris yang berada di Kampung Inggris Pare,
            Kediri. Berbekal pengalaman di lapangan selama lebih dari 10
            tahun, kami telah menyusun dan mempelajari cara-cara yang
            efektif dan efisien untuk membantu siswa mempelajari Bahasa
            Inggris. Dengan konsep Fun English Learning ditambah metode
            terkini yang selalu dikembangkan dan diintegrasikan dengan
            system belajar ala Kampung Inggris, siswa akan lebih mudah dan
            cepat dalam menguasai bahasa Inggris bersama kami.
          </p>
        </div>
      </section>

    </main>
  );
}
