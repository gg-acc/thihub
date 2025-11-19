import React from 'react';
import Link from 'next/link';

export default function ArticleHeader() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0F4C81] text-white flex items-center justify-center font-serif font-bold text-xl rounded-sm">
                        T
                    </div>
                    <span className="font-serif font-bold text-lg text-gray-900 tracking-tight">Top Health Insider</span>
                </Link>
                <div className="text-[10px] font-sans font-medium text-gray-500 uppercase tracking-widest border border-gray-200 px-2 py-1 rounded">
                    Trending Report
                </div>
            </div>
        </header>
    );
}
