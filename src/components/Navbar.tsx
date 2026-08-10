"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm rounded-b-[3rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand WEST */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-west-rm-bg.webp"
              alt="WEST Wavi English School & Training"
              width={160}
              height={50}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-10 lg:gap-14">
            <Link
              href="/"
              className="text-[#198d83] font-bold text-lg hover:text-[#146c64] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#program"
              className="text-[#198d83] font-bold text-lg hover:text-[#146c64] transition-colors"
            >
              Program
            </Link>
            <Link
              href="/tutor"
              className="text-[#198d83] font-bold text-lg hover:text-[#146c64] transition-colors"
            >
              Tutor Kami
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden p-2 text-[#198d83] hover:bg-gray-50 rounded-md focus:outline-none"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu (Dropdown) */}
      {open && (
        <div className="md:hidden bg-white px-6 pb-6 pt-2 space-y-4 shadow-lg border-t border-gray-100">
          <Link
            href="/"
            className="block text-[#198d83] font-bold text-lg hover:text-[#146c64] transition-colors"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/#program"
            className="block text-[#198d83] font-bold text-lg hover:text-[#146c64] transition-colors"
            onClick={() => setOpen(false)}
          >
            Program
          </Link>
          <Link
            href="/tutor"
            className="block text-[#198d83] font-bold text-lg hover:text-[#146c64] transition-colors"
            onClick={() => setOpen(false)}
          >
            Tutor Kami
          </Link>
        </div>
      )}
    </nav>
  );
}