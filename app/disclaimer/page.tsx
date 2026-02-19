import Link from 'next/link';
import { getBranding } from '@/utils/branding';

export const metadata = {
    title: 'Disclaimers',
    description: 'Important disclaimers and legal information.',
};

export default async function DisclaimerPage() {
    const brand = await getBranding();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div
                            className="w-8 h-8 flex items-center justify-center font-serif font-bold text-xl rounded-sm text-white"
                            style={{ backgroundColor: brand.logoColor }}
                        >
                            {brand.logoLetter}
                        </div>
                        <span className="font-serif font-bold text-lg tracking-tight text-slate-900">
                            {brand.brandName}
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-16">
                {/* Title Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
                        Disclaimers
                    </h1>
                    <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
                </div>

                {/* Content */}
                <div className="prose prose-slate prose-lg max-w-none">
                    <p className="text-slate-700 leading-relaxed">
                        All content contained on or available through this website, including text, graphics, images, and information, is for general information purposes only and should not be relied on for medical or personal advice. The information on our website is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Never disregard professional medical advice or delay seeking medical treatment because of something you have read on this website.
                    </p>

                    <p className="text-slate-700 leading-relaxed">
                        Information and research are constantly evolving. {brand.brandName} makes no representation and assumes no responsibility for the accuracy of the information contained on or available through this website, and such information is subject to change without notice. You are encouraged to confirm any information obtained from or through this website with other sources and to review all information regarding any condition or treatment with your physician.
                    </p>

                    <p className="text-slate-700 leading-relaxed">
                        {brand.brandName} does not recommend, endorse or make any representations about the efficacy, appropriateness, or suitability of any specific tests, products, procedures, treatments, services, testimonials, opinions, or other information that may be contained on or available through this website. {brand.brandName} is not responsible nor liable for any advice, course of treatment, diagnosis, or any other information or products that you obtain through this website.
                    </p>
                </div>

                {/* Footer Note */}
                <div className="mt-16 pt-8 border-t border-slate-200">
                    <p className="text-center text-sm text-slate-500">
                        © {new Date().getFullYear()} {brand.brandName}. All rights reserved.
                    </p>
                </div>
            </main>
        </div>
    );
}
