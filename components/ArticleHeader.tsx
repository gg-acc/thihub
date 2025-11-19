import React from 'react';

export default function ArticleHeader() {
    // Calculate "Day before yesterday"
    const date = new Date();
    date.setDate(date.getDate() - 2);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Random volume number for "insider" feel
    const volume = 842;

    return (
        <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-50 shadow-sm">
            <div className="max-w-xl mx-auto px-4 text-center">
                <h1 className="font-serif font-bold text-2xl text-gray-900 tracking-tight leading-none">
                    Top Health Insider
                </h1>
                <p className="text-[11px] text-gray-500 font-sans mt-1 uppercase tracking-wider">
                    Trending Report Vol. {volume} • {formattedDate}
                </p>
            </div>
        </header>
    );
}
