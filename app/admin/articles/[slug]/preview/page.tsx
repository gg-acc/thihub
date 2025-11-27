'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
    slug: string;
    title: string;
    subtitle: string;
    content: string;
    author: string;
    reviewer: string;
    date: string;
    image: string;
    ctaText?: string;
    ctaTitle?: string;
    ctaDescription?: string;
    keyTakeaways?: { title: string; content: string }[] | null;
}

// View-only CinematicHero for accurate mobile preview
function MobileHero({ article }: { article: Article }) {
    return (
        <div className="relative w-full min-h-[85vh] flex items-end pb-20 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={article.image}
                    alt="Hero Background"
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
            </div>

            {/* Content - matches CinematicHero exactly */}
            <div className="relative z-10 w-full max-w-3xl mx-auto px-5">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-sm">
                        Investigative Report
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-white/20">
                        5 Min Read
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Fact Checked
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Medically Reviewed
                        </span>
                    </div>
                </div>

                <h1 className="text-4xl font-serif font-black text-white leading-[1.2] mb-6 tracking-tight drop-shadow-lg break-words hyphens-auto">
                    {article.title}
                </h1>

                <p className="text-lg text-gray-200 font-sans font-light leading-relaxed mb-8 max-w-xl drop-shadow-md">
                    {article.subtitle}
                </p>

                {/* Byline */}
                <div className="flex items-center gap-4 border-t border-white/20 pt-6">
                    <div className="w-12 h-12 rounded-full ring-2 ring-white/30 p-0.5 bg-black/20 backdrop-blur-sm flex-shrink-0">
                        <img
                            src="https://picsum.photos/seed/doc/100"
                            alt="Author"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm tracking-wide">{article.author}</span>
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400" aria-label="Verified">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                            <span>{article.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mobile Header - matches ArticleHeader exactly
function MobileHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center font-serif font-bold text-xl rounded-sm bg-white text-gray-900">
                        T
                    </div>
                    <span className="font-serif font-bold text-lg tracking-tight text-white drop-shadow-md">
                        Top Health Insider
                    </span>
                </div>
                <div className="text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 rounded-full border text-white border-white/30 bg-black/20 backdrop-blur-sm">
                    Trending Report
                </div>
            </div>
        </header>
    );
}

export default function PreviewPage() {
    const [article, setArticle] = useState<Article | null>(null);

    useEffect(() => {
        // Listen for messages from parent window
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'ARTICLE_UPDATE') {
                setArticle(event.data.article);
            }
        };

        window.addEventListener('message', handleMessage);

        // Request initial data from parent
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!article) {
        return (
            <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
                <div className="text-zinc-400 text-sm">Loading preview...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-serif">
            {/* Header - Exact match to ArticleHeader */}
            <MobileHeader />

            {/* Hero - View only, matches CinematicHero exactly */}
            <MobileHero article={article} />

            {/* Content Area */}
            <main className="px-5 max-w-[680px] mx-auto -mt-20 relative z-20 bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pt-10">
                {/* Key Takeaways */}
                {article.keyTakeaways && article.keyTakeaways.length > 0 && (
                    <div className="bg-blue-50/50 border-l-4 border-[#0F4C81] p-6 my-8 rounded-r-lg shadow-sm">
                        <h3 className="flex items-center gap-2 text-[#0F4C81] font-bold text-lg uppercase tracking-wide mb-4 font-sans">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Key Takeaways
                        </h3>
                        <ul className="space-y-3">
                            {article.keyTakeaways.map((item, index) => (
                                <li key={index} className="flex items-start gap-3 text-gray-800 font-sans text-[15px] leading-relaxed">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-[#0F4C81] rounded-full flex-shrink-0"></span>
                                    <div>
                                        <span className="font-bold">{item.title}</span>
                                        {item.content && <span> — {item.content}</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Article Content */}
                <article className="prose prose-lg max-w-none text-gray-800 font-serif leading-loose prose-h2:mb-4 prose-h3:mb-3 prose-p:mt-2 prose-img:my-8">
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                </article>

                {/* CTA Section */}
                <div className="my-12 p-8 bg-blue-50 rounded-xl text-center border border-blue-100 shadow-sm">
                    <p className="text-xl font-serif mb-4 text-gray-900 font-medium">
                        {article.ctaTitle || "Curious about the science?"}
                    </p>
                    <Link 
                        href="#" 
                        className="inline-block bg-[#0F4C81] text-white px-8 py-4 rounded-lg font-sans font-bold text-lg hover:bg-[#0a3b66] transition-colors shadow-md hover:shadow-lg"
                    >
                        {article.ctaText || "Read the Clinical Study »"}
                    </Link>
                    <p className="mt-4 text-xs text-gray-500 font-sans">
                        {article.ctaDescription || "Secure, verified link to official research."}
                    </p>
                </div>

                {/* Discussion placeholder */}
                <div className="font-sans border-t border-gray-200 pt-10 pb-20">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Discussion</h3>
                    <div className="text-sm text-gray-400">Comments section...</div>
                </div>
            </main>
        </div>
    );
}

