import Image from "next/image";

const TUTORS_DATA = [
  {
    id: 1,
    name: "Anasrul Rafi M",
    university: "Universitas Brawijaya",
    major: "Sastra Inggris",
    experience: "5 Years experience of teaching English",
    imageUrl: "", 
  },
  {
    id: 2,
    name: "Fa'iz Maulana H",
    university: "Universitas Negeri Malang",
    major: "Pendidikan Bahasa Inggris",
    experience: "4 Years experience of teaching English",
    imageUrl: "", 
  },
  {
    id: 3,
    name: "Nanda Syahputra",
    university: "Universitas Gadjah Mada",
    major: "Sastra Inggris",
    experience: "6 Years experience of teaching English",
    imageUrl: "", 
  },
  {
    id: 4,
    name: "Dinda Kirana",
    university: "Universitas Airlangga",
    major: "Linguistik Terapan",
    experience: "3 Years experience of teaching English",
    imageUrl: "", 
  },
  {
    id: 5,
    name: "Fa'iz Maulana H",
    university: "Universitas Negeri Malang",
    major: "Pendidikan Bahasa Inggris",
    experience: "4 Years experience of teaching English",
    imageUrl: "", 
  },
];

export default function TutorPage() {
  return (
    <main className="min-h-screen bg-[#72c2b3] pt-10 sm:pt-16 flex flex-col items-center overflow-x-hidden">
      
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wide mb-10 sm:mb-16 text-center drop-shadow-md px-4 pb-2 bg-gradient-to-r from-white via-amber-300 to-white bg-clip-text text-transparent">
        Meet Our Tutors
      </h1>

      <div className="w-full max-w-5xl px-4 sm:px-6 flex flex-col gap-8 sm:gap-10 md:gap-12 z-10 mb-10">
        {TUTORS_DATA.map((tutor) => (
          <div 
            key={tutor.id}
            className="flex flex-col sm:flex-row items-center bg-[#bfe5de] rounded-[2rem] sm:rounded-[3rem] shadow-xl hover:shadow-2xl transition-shadow duration-300 w-full max-w-4xl mx-auto p-5 sm:p-6 md:p-8 md:pr-12 gap-4 sm:gap-6 md:gap-10 group"
          >
            
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-[240px] md:h-[240px] flex-shrink-0 relative rounded-full overflow-hidden bg-[#e0e0e0] flex flex-col items-center justify-center shadow-md">
              {tutor.imageUrl ? (
                <Image 
                  src={tutor.imageUrl} 
                  alt={`Tutor ${tutor.name}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center flex flex-col items-center mt-4">
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-2 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className="font-semibold text-xs sm:text-sm">Foto Belum Tersedia</span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
              
              <div className="w-max mx-auto sm:mx-0 mb-2 sm:mb-3 border-b-[3px] border-black pb-1 sm:pb-1.5">
                <h2 className="text-2xl sm:text-2xl md:text-[34px] font-bold text-black tracking-tight leading-none">
                  {tutor.name}
                </h2>
              </div>

              <div className="text-[#135c52] font-bold text-sm sm:text-[17px] md:text-[19px] mb-2 flex items-start sm:items-center justify-center sm:justify-start gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
                </svg>
                <span className="text-left leading-tight">{tutor.university} - {tutor.major}</span>
              </div>

              <p className="text-black font-bold text-lg sm:text-xl md:text-[22px] leading-snug mt-1">
                {tutor.experience}
              </p>
              
            </div>
          </div>
        ))}
      </div>

      <div className="w-full overflow-hidden mt-8 relative z-0">
        <div className="bg-white h-16 sm:h-24 md:h-32 w-[150%] -ml-[25%] rounded-t-[100%] shadow-[0_-10px_25px_rgba(0,0,0,0.05)]"></div>
      </div>
      
    </main>
  );
}
