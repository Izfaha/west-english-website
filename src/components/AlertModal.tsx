"use client";

import React from "react";

interface AlertModalProps {
  isConfirmOpen: boolean;
  isWaitingOpen: boolean;
  isErrorOpen: boolean;
  errorMessage: string;
  countdown: number;
  onConfirmYes: () => void;
  onConfirmNo: () => void;
  onErrorClose: () => void;
}

export default function AlertModal({
  isConfirmOpen,
  isWaitingOpen,
  isErrorOpen,
  errorMessage,
  countdown,
  onConfirmYes,
  onConfirmNo,
  onErrorClose,
}: AlertModalProps) {
  if (!isConfirmOpen && !isWaitingOpen && !isErrorOpen) return null;

  return (
    <>
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-[#59a89d] rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl max-w-lg w-full text-center border-4 border-[#6bc7ba]">
            <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 leading-snug">
              Apakah data yg anda masukan sudah benar?
            </h2>
            <div className="flex justify-center gap-4 sm:gap-6">
              <button
                onClick={onConfirmYes}
                className="bg-white hover:bg-gray-100 text-[#1b7a70] font-bold text-lg sm:text-xl py-2.5 sm:py-3 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-lg transition-transform hover:scale-105"
              >
                Ya
              </button>
              <button
                onClick={onConfirmNo}
                className="bg-white hover:bg-gray-100 text-[#1b7a70] font-bold text-lg sm:text-xl py-2.5 sm:py-3 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-lg transition-transform hover:scale-105"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}

      {isWaitingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-[#59a89d] rounded-2xl sm:rounded-[2rem] p-8 sm:p-10 md:p-14 shadow-2xl max-w-xl w-full text-center border-4 border-[#6bc7ba] flex flex-col items-center">
            <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-10 leading-snug">
              Data berhasil disimpan & anda akan diarahkan<br className="hidden sm:block" /> ke WhatsApp dalam
            </h2>
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-[#1b7a70] shadow-inner">
              {countdown}
            </div>
          </div>
        </div>
      )}

      {isErrorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-[#59a89d] rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl max-w-lg w-full text-center border-4 border-[#6bc7ba]">
            <div className="mb-4 sm:mb-6 flex justify-center">
              <div className="bg-white rounded-full p-2.5 sm:p-3">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[#f2790f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-white text-base sm:text-xl md:text-2xl font-bold mb-6 sm:mb-8 leading-relaxed">
              {errorMessage}
            </h2>
            <button
              onClick={onErrorClose}
              className="bg-[#f2790f] hover:bg-[#d96b0b] text-white font-bold text-lg sm:text-xl py-2.5 sm:py-3 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-lg transition-transform hover:scale-105"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
