import React from 'react';

export default function KeyTakeaways() {
    return (
        <div className="bg-blue-50/50 border-l-4 border-[#0F4C81] p-6 my-8 rounded-r-lg shadow-sm">
            <h3 className="flex items-center gap-2 text-[#0F4C81] font-bold text-lg uppercase tracking-wide mb-4 font-sans">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Key Takeaways
            </h3>
            <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-800 font-sans text-[15px] leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-[#0F4C81] rounded-full flex-shrink-0"></span>
                    <span><strong>Metabolic Hibernation:</strong> Drastic calorie cutting can trigger a survival mode that halts fat burning.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-800 font-sans text-[15px] leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-[#0F4C81] rounded-full flex-shrink-0"></span>
                    <span><strong>The 5-Second Ritual:</strong> A specific morning nutrient combination can signal safety to the body and reactivate metabolism.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-800 font-sans text-[15px] leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-[#0F4C81] rounded-full flex-shrink-0"></span>
                    <span><strong>Clinical Evidence:</strong> Studies suggest this method may increase metabolic rate significantly within the first hour of waking.</span>
                </li>
            </ul>
        </div>
    );
}
