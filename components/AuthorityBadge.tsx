import React from 'react';

interface AuthorityBadgeProps {
    type: 'verified' | 'medical' | 'editor';
    text?: string;
}

export default function AuthorityBadge({ type, text }: AuthorityBadgeProps) {
    const icons = {
        verified: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
        ),
        medical: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600">
                <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
            </svg>
        ),
        editor: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-600">
                <path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z" />
            </svg>
        )
    };

    const defaultText = {
        verified: 'Verified Author',
        medical: 'Medically Reviewed',
        editor: 'Editor\'s Pick'
    };

    if (type === 'verified') {
        return (
            <div className="flex items-center gap-1">
                <div className="bg-[#1877F2] rounded-full p-[2px] flex items-center justify-center">
                    {icons.verified}
                </div>
                <span className="text-[13px] text-[#1877F2] font-semibold">
                    {text || defaultText[type]}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 inline-flex">
            {icons[type]}
            <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                {text || defaultText[type]}
            </span>
        </div>
    );
}
