'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComparisonFeature {
    name: string;
    us: boolean;
    them: boolean;
}

interface ComparisonTableProps {
    features: ComparisonFeature[];
    ourBrand?: string;
    theirBrand?: string;
    className?: string;
}

export default function ComparisonTable({
    features,
    ourBrand = 'Our Formula',
    theirBrand = 'Generic Brands',
    className
}: ComparisonTableProps) {
    return (
        <div className={cn('my-8 not-prose', className)}>
            {/* Table Container */}
            <div className="bg-emerald-50/30 rounded-xl border-2 border-emerald-500/20 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[80px_1fr_80px] sm:grid-cols-[100px_1fr_100px] bg-white border-b border-emerald-100">
                    {/* Us Header */}
                    <div className="p-3 flex items-center justify-center bg-emerald-50/50 border-r border-emerald-100">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-emerald-800 text-center leading-tight">
                            {ourBrand}
                        </span>
                    </div>
                    
                    {/* Feature Header */}
                    <div className="p-3 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">Feature</span>
                    </div>

                    {/* Them Header */}
                    <div className="p-3 flex items-center justify-center bg-gray-50/50 border-l border-emerald-100">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight text-gray-500 text-center leading-tight">
                            {theirBrand}
                        </span>
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-emerald-100/50 bg-white">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={cn(
                                "grid grid-cols-[80px_1fr_80px] sm:grid-cols-[100px_1fr_100px] items-stretch",
                                index % 2 === 0 ? "bg-emerald-50/30" : "bg-white"
                            )}
                        >
                            {/* Us Column (Check/X) */}
                            <div className="p-2 sm:p-3 flex items-center justify-center border-r border-emerald-100/50 bg-emerald-50/30">
                                {feature.us ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-emerald-500 flex items-center justify-center shadow-sm">
                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-200 flex items-center justify-center">
                                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            {/* Feature Name */}
                            <div className="p-2 sm:p-3 flex items-center justify-center text-center">
                                <span className="text-xs sm:text-sm text-gray-700 font-medium leading-snug">
                                    {feature.name}
                                </span>
                            </div>

                            {/* Them Column (Check/X) */}
                            <div className="p-2 sm:p-3 flex items-center justify-center border-l border-emerald-100/50">
                                {feature.them ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-emerald-500 flex items-center justify-center shadow-sm">
                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-100 flex items-center justify-center">
                                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
