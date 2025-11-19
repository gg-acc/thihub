import Header from '@/components/Header';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white pb-10 font-serif">
      <Header />

      <main className="pt-16 px-4 max-w-xl mx-auto">
        {/* Breaking News Banner */}
        <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 inline-block uppercase tracking-wider mb-3">
          Special Report
        </div>

        {/* Main Headline - Suspenseful */}
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
          The "5-Second Morning Ritual" That Top Doctors Are Calling a "Game Changer" for Metabolism
        </h1>

        {/* Subheadline / Teaser */}
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          It’s not a diet. It’s not a pill. It’s a simple biological hack that has been hidden in plain sight for decades. Why are we only hearing about it now?
        </p>

        {/* Author/Authority */}
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-6">
          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
            <img src="https://picsum.photos/seed/doc/100" alt="Dr. Smith" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Investigative Report by Sarah Jenkins</p>
            <p className="text-xs text-gray-500">Medically Reviewed by Dr. A. Peterson, MD</p>
          </div>
        </div>

        {/* Call to Action / Read Article */}
        <Link href="/articles/morning-ritual-exposed" className="block group">
          <div className="relative overflow-hidden rounded-lg mb-4 shadow-md">
            <img src="https://picsum.photos/seed/ritual/800/600" alt="Morning Ritual" className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <span className="text-white font-bold flex items-center gap-2">
                Read Full Report
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </Link>

        {/* Social Proof Snippets */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">What Readers Are Saying</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="text-yellow-500">★★★★★</div>
              <p className="text-sm text-gray-600 italic">"I was skeptical, but the science makes sense. I tried it and..."</p>
            </div>
            <div className="flex gap-2">
              <div className="text-yellow-500">★★★★★</div>
              <p className="text-sm text-gray-600 italic">"Finally, someone explains the root cause instead of just treating symptoms."</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
