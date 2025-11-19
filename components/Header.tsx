import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button className="p-1 -ml-1 text-gray-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-1">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-lg font-serif">
            T
          </div>
          <span className="text-gray-900 text-lg font-bold tracking-tight font-serif">
            Top Health Daily
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button className="w-9 h-9 flex items-center justify-center text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
