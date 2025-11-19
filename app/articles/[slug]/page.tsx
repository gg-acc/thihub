import React from 'react';
import ArticleHeader from '@/components/ArticleHeader';
import AuthorityBadge from '@/components/AuthorityBadge';
import FBComments from '@/components/FBComments';
import Link from 'next/link';

// Mock data function
async function getArticle(slug: string) {
    return {
        id: slug,
        title: 'The "5-Second Morning Ritual" That Top Doctors Are Calling a "Game Changer" for Metabolism',
        subtitle: 'It’s not a diet. It’s not a pill. It’s a simple biological hack that has been hidden in plain sight for decades.',
        author: 'Sarah Jenkins',
        reviewer: 'Dr. A. Peterson, MD',
        date: 'Updated: 2 hours ago',
        content: `
      <p class="mb-6 font-bold text-lg leading-relaxed">If you've ever felt like your metabolism is "broken" no matter how little you eat, you are not alone. But a new investigative report reveals the culprit might not be your diet at all.</p>
      
      <p class="mb-6 leading-relaxed">For decades, the weight loss industry has told us to "eat less and move more." It sounds logical. It sounds scientific. But for millions of people, it simply does not work.</p>
      
      <p class="mb-6 leading-relaxed">Why? Because they were ignoring a tiny biological switch inside your cells.</p>
      
      <h3 class="font-bold text-2xl mt-8 mb-4 text-gray-900 font-sans">The "Metabolic Hibernation" Theory</h3>
      
      <p class="mb-6 leading-relaxed">Dr. Peterson, a leading researcher in metabolic health, explains: "When you cut calories drastically, your body thinks it's starving. It panics. It goes into what we call 'Metabolic Hibernation.' It holds onto every gram of fat for survival."</p>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-6 my-8 italic text-gray-800 text-lg font-medium">
        "It's not your fault. Your body is fighting against you because it thinks it's saving your life." - Dr. Peterson
      </div>

      <p class="mb-6 leading-relaxed">This is the <strong>Problem Mechanism</strong>. It's the invisible wall that stops you from seeing results, no matter how hard you try. It's why you can eat salad for a week and lose nothing, while your friend eats pizza and stays thin.</p>
      
      <p class="mb-6 leading-relaxed">But here is the good news. There is a way to "flip the switch" back on. And it takes less than 5 seconds every morning.</p>
      
      <h3 class="font-bold text-2xl mt-8 mb-4 text-gray-900 font-sans">The Solution Mechanism: The 5-Second Ritual</h3>
      
      <p class="mb-6 leading-relaxed">This ritual doesn't involve a treadmill. It doesn't involve kale smoothies. It involves a specific combination of nutrients taken right when you wake up that signals to your body: "We are safe. Burn fuel."</p>
      
      <p class="mb-6 leading-relaxed">Clinical trials have shown that this specific trigger can increase metabolic rate by up to 300% within the first hour of waking up.</p>

      <p class="mb-6 leading-relaxed">Imagine waking up, doing this simple 5-second hack, and knowing that your body is burning fat all day long, even while you sit at your desk or watch TV.</p>
      
      <p class="mb-6 leading-relaxed">It sounds too good to be true, but the science is undeniable. Thousands of men and women are already using this ritual to reclaim their health and energy.</p>
      
      <p class="mb-8 leading-relaxed">If you are ready to stop fighting your body and start working with it, you need to see the evidence for yourself.</p>
    `,
        image: 'https://picsum.photos/seed/ritual/800/600',
    };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = await getArticle(slug);

    return (
        <div className="min-h-screen bg-white pb-10 font-serif">
            <ArticleHeader />

            {/* Live Readership Bar */}
            <div className="bg-red-600 text-white text-center py-1 text-xs font-bold font-sans flex items-center justify-center gap-2 animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full inline-block"></span>
                842 people are reading this report right now
            </div>

            <main className="pt-6 px-4 max-w-xl mx-auto">

                {/* Article Header */}
                <div className="mb-6">
                    <div className="flex gap-2 mb-3">
                        <AuthorityBadge type="verified" />
                        <AuthorityBadge type="medical" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3 font-serif">
                        {article.title}
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed font-sans">
                        {article.subtitle}
                    </p>
                </div>

                {/* Byline */}
                <div className="flex items-center justify-between border-y border-gray-100 py-4 mb-6 font-sans">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                            <img src="https://picsum.photos/seed/doc/100" alt="Author" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-[15px] font-bold text-[#1877F2] hover:underline cursor-pointer">{article.author}</p>
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#1877F2]">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                            </div>
                            <p className="text-xs text-gray-500">{article.date}</p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Medically Reviewed By</p>
                        <p className="text-sm font-bold text-green-700 flex items-center justify-end gap-1">
                            {article.reviewer}
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                        </p>
                    </div>
                </div>

                {/* Article Content */}
                <article className="prose prose-lg max-w-none text-gray-800 font-serif leading-relaxed">
                    <img src={article.image} alt="Article Image" className="w-full rounded-lg mb-8 shadow-sm" />
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                </article>

                {/* Subtle CTA Link */}
                <div className="my-10 text-center">
                    <p className="text-lg font-serif mb-2">Curious about the science?</p>
                    <Link href="#" className="text-[#1877F2] font-bold text-xl hover:underline font-sans">
                        Click here to read the full clinical study on the 5-Second Ritual »
                    </Link>
                </div>

                {/* Facebook Comments Section */}
                <div className="font-sans">
                    <FBComments />
                </div>
            </main>
        </div>
    );
}
