import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 300;

// Step 1: Scrape CTA URL and return product context
// This is fast — just fetches and cleans the page text

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ctaUrl } = await request.json();

        if (!ctaUrl || !ctaUrl.startsWith('http')) {
            return NextResponse.json({ error: 'Valid CTA URL is required' }, { status: 400 });
        }

        console.log('[step1] Scraping CTA:', ctaUrl);

        const res = await fetch(ctaUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Could not fetch CTA URL. Check the link.' }, { status: 400 });
        }

        const html = await res.text();
        const productText = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);

        console.log('[step1] Scraped, length:', productText.length);

        return NextResponse.json({ success: true, productText });
    } catch (error) {
        console.error('[step1] Error:', error);
        return NextResponse.json({ error: 'Failed to scrape CTA URL' }, { status: 500 });
    }
}
