import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 300;

// Step 2: Claude writes the article and saves it to DB

export async function POST(request: Request) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set.' }, { status: 500 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            topic, ctaUrl, productText, brief,
            narrativeStyle = 'first-person',
            framework = 'modern-native',
            pixelId, slug: customSlug, domainId,
        } = await request.json();

        if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        if (!productText) return NextResponse.json({ error: 'Product text is required' }, { status: 400 });

        // Build the prompt
        const frameworkInst = framework === 'classic-dr'
            ? 'FRAMEWORK: Classic Direct Response (Schwartz, Halbert, Ogilvy, Hopkins). Structure: Big Promise > Proof > Mechanism > Social Proof > Urgency > CTA'
            : 'FRAMEWORK: Modern Native Ad (Brunson, Georgi, Kern). Structure: Hook > Relatable Story > Problem > Discovery > Unique Mechanism > Proof > Soft CTA';

        const narrativeInst = narrativeStyle === 'first-person'
            ? 'NARRATIVE: First-person story. Believable protagonist who experienced the problem and found the solution. Specific scenes, emotions, dialogue.'
            : 'NARRATIVE: Third-person investigative journalism. Reporter investigating a trend. Expert quotes, studies, data. Editorial objectivity leading to the product.';

        const briefInst = brief ? `\nBRIEF (follow closely): ${brief}` : '';

        const prompt = `Write an advertorial article and return ONLY valid JSON.

TOPIC: ${topic}
PRODUCT PAGE (${ctaUrl}): ${productText}
${frameworkInst}
${narrativeInst}${briefInst}

RULES: 1500-2500 words. Genuine editorial feel, not an ad. Never say "ad"/"sponsored". Build emotion before product. Include 2-3 testimonial quotes. Soft CTA ending.

Return ONLY this JSON (no markdown fences):
{"title":"Headline","subtitle":"Subheadline","author":"Name","reviewer":"Dr. Name, MD","date":"Updated: 2 hours ago","content":"<p>Full article as HTML with p/h2/h3/blockquote/strong/em/ul/ol tags. NO title/subtitle here.</p>","keyTakeaways":[{"title":"Title","content":"Sentence"},{"title":"Title","content":"Sentence"},{"title":"Title","content":"Sentence"}],"comments":[{"id":"c1","author":"Name","avatar":"https://picsum.photos/seed/c1/100","content":"Comment","time":"2h","likes":45,"hasReplies":false,"isLiked":true},{"id":"c2","author":"Name","avatar":"https://picsum.photos/seed/c2/100","content":"Comment","time":"5h","likes":23,"hasReplies":false,"isLiked":false},{"id":"c3","author":"Name","avatar":"https://picsum.photos/seed/c3/100","content":"Comment","time":"8h","likes":67,"hasReplies":true,"isLiked":true},{"id":"c4","author":"Name","avatar":"https://picsum.photos/seed/c4/100","content":"Comment","time":"1d","likes":12,"hasReplies":false,"isLiked":false},{"id":"c5","author":"Name","avatar":"https://picsum.photos/seed/c5/100","content":"Comment","time":"1d","likes":34,"hasReplies":false,"isLiked":true}]}`;

        console.log('[step2] Claude writing...');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const claudeResponse = await anthropic.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 16000,
            messages: [{ role: 'user', content: prompt }],
        });

        const rawResponse = claudeResponse.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');

        console.log('[step2] Response length:', rawResponse.length);

        let generatedData;
        try {
            const jsonStr = rawResponse.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
            generatedData = JSON.parse(jsonStr);
        } catch {
            console.error('[step2] JSON parse fail:', rawResponse.slice(0, 300));
            return NextResponse.json({ error: 'Failed to parse article. Try again.' }, { status: 500 });
        }

        // Determine slug
        let slug = customSlug;
        if (!slug) {
            slug = generatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        } else {
            slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        }

        // Save to DB
        const newArticle = {
            slug,
            title: generatedData.title,
            subtitle: generatedData.subtitle,
            author: generatedData.author,
            reviewer: generatedData.reviewer,
            date: generatedData.date,
            content: generatedData.content,
            key_takeaways: generatedData.keyTakeaways,
            comments: generatedData.comments,
            image: `https://picsum.photos/seed/${slug}/800/600`,
            cta_text: 'Check Availability \u00BB',
            cta_title: 'Curious about the science?',
            cta_description: 'Secure, verified link to official research.',
            pixel_id: pixelId || '',
            cta_url: ctaUrl || '',
            article_theme: 'v1',
            domain_id: domainId || null,
            updated_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase.from('articles').select('slug').eq('slug', slug).single();
        if (existing) {
            newArticle.slug = `${slug}-${Math.random().toString(36).substring(7)}`;
        }

        const { error } = await supabase.from('articles').insert(newArticle);
        if (error) throw error;

        console.log('[step2] Saved:', newArticle.slug);

        return NextResponse.json({ success: true, slug: newArticle.slug });
    } catch (error) {
        console.error('[step2] Error:', error);
        return NextResponse.json({ error: 'Failed to write article' }, { status: 500 });
    }
}
