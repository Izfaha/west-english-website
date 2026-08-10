import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white pt-12 sm:pt-16 pb-8 sm:pb-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 lg:gap-8 items-start">
          
          <div className="sm:col-span-2 flex flex-col gap-5 sm:gap-6">
            <Link href="/" className="inline-block mb-1 sm:mb-2">
              <Image
                src="/logo-west-rm-bg.webp"
                alt="WEST Wavi English School & Training"
                width={160}
                height={50}
                className="h-10 sm:h-14 w-auto object-contain"
              />
            </Link>

            <div className="flex flex-col gap-3 sm:gap-4 text-[#198d83]">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-sm sm:text-[15px]">Address:</p>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-[15px] leading-relaxed">JL. Cempaka No. 42A Tulungrejo - Pare -<br/>Kediri</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                </svg>
                <p className="text-sm sm:text-[15px]">Tel : 085 234 567 383</p>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
                <p className="text-sm sm:text-[15px]">Response hours: 08.00 - 20.00</p>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
                <p className="text-sm sm:text-[15px]">Email: info@onlearn.com</p>
              </div>
            </div>
          </div>

          <div className="pt-0 sm:pt-2">
            <h4 className="text-[#0d1633] text-lg sm:text-xl font-bold mb-4 sm:mb-6">Pages</h4>
            <div className="flex flex-col gap-3 sm:gap-5 text-sm sm:text-[17px] text-[#198d83]">
              <Link href="/" className="hover:text-[#146c64] hover:font-medium transition-all">Home</Link>
              <Link href="/#program" className="hover:text-[#146c64] hover:font-medium transition-all">Program</Link>
              <Link href="/tutor" className="hover:text-[#146c64] hover:font-medium transition-all">Tutor Kami</Link>
            </div>
          </div>

          <div className="pt-0 sm:pt-2">
            <h4 className="text-[#0d1633] text-lg sm:text-xl font-bold mb-4 sm:mb-6">Social Media</h4>
            <div className="flex flex-col gap-3 sm:gap-5 text-sm sm:text-[17px] text-[#198d83]">
              <Link href="#" className="hover:text-[#146c64] hover:font-medium transition-all">Instagram</Link>
              <Link href="#" className="hover:text-[#146c64] hover:font-medium transition-all">Facebook</Link>
              <Link href="#" className="hover:text-[#146c64] hover:font-medium transition-all">TikTok</Link>
            </div>
          </div>

        </div>
        
        <div className="border-t border-gray-100 mt-8 sm:mt-12 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-gray-400">
          &copy; {new Date().getFullYear()} WEST Wavi English School & Training.
        </div>
      </div>
    </footer>
  );
}
