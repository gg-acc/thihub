import React from 'react';

type BadgeType = 'fact-checked' | 'medically-reviewed' | 'evidence-based';

export default function TrustBadge({ type }: { type: BadgeType }) {
    const config = {
        'fact-checked': {
            text: 'Fact Checked',
            color: 'text-blue-700',
            bg: 'bg-blue-50',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            )
        },
        'medically-reviewed': {
            text: 'Medically Reviewed',
            color: 'text-green-700',
            bg: 'bg-green-50',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        'evidence-based': {
            text: 'Evidence Based',
            color: 'text-purple-700',
            bg: 'bg-purple-50',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )
        }
    };

    const { text, color, bg, icon } = config[type];

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${color} text-[11px] font-bold uppercase tracking-wider font-sans border border-transparent hover:border-current transition-colors cursor-help`} title={`This content is ${text.toLowerCase()}`}>
            {icon}
            {text}
        </div>
    );
}
