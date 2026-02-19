import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 300;

// ─── Admin Supabase client (bypasses RLS for storage uploads) ────────────

function getAdmin() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ─── Image Generation ────────────────────────────────────────────────────

const IMAGE_MODELS = ['nano-banana-pro-preview', 'gemini-2.5-flash-image'];

async function generateImage(prompt: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    for (const model of IMAGE_MODELS) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
                    }),
                }
            );

            if (!res.ok) {
                console.log(`[img] ${model} → HTTP ${res.status}`);
                continue;
            }

            const data = await res.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

            if (!imgPart?.inlineData) {
                console.log(`[img] ${model} → no image in response`);
                continue;
            }

            console.log(`[img] ${model} → success`);
            return {
                buffer: Buffer.from(imgPart.inlineData.data, 'base64'),
                mimeType: imgPart.inlineData.mimeType,
            };
        } catch (err) {
            console.log(`[img] ${model} → error: ${err}`);
            continue;
        }
    }

    return null;
}

async function generateAndUpload(prompt: string, admin: any): Promise<string | null> {
    const result = await generateImage(prompt);
    if (!result) return null;

    const ext = result.mimeType === 'image/png' ? 'png' : 'jpg';
    const fileName = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await admin.storage
        .from('article-images')
        .upload(fileName, result.buffer, {
            contentType: result.mimeType,
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('[img] upload failed:', error.message);
        return null;
    }

    const { data: { publicUrl } } = admin.storage
        .from('article-images')
        .getPublicUrl(fileName);

    console.log('[img] uploaded:', fileName);
    return publicUrl;
}

// ─── Insert images into HTML at paragraph breaks ─────────────────────────

function insertImagesIntoHtml(html: string, heroUrl: string | null, inlineUrls: string[]): string {
    if (inlineUrls.length === 0) return html;

    // Split at closing block tags
    const parts = html.split(/(<\/(?:p|h[2-6]|blockquote|ul|ol)>)/i);
    const closingIndices: number[] = [];
    for (let i = 0; i < parts.length; i++) {
        if (/^<\/(?:p|h[2-6]|blockquote|ul|ol)>$/i.test(parts[i])) {
            closingIndices.push(i);
        }
    }

    if (closingIndices.length < 4) return html;

    // Spread images evenly, skip first 2 paragraphs
    const slots = closingIndices.slice(2);
    const step = Math.max(1, Math.floor(slots.length / inlineUrls.length));

    const inserts = new Map<number, string>();
    for (let i = 0; i < inlineUrls.length && i * step < slots.length; i++) {
        inserts.set(
            slots[i * step],
            `<figure class="my-8"><img src="${inlineUrls[i]}" alt="" class="w-full rounded-lg shadow-md" /></figure>`
        );
    }

    return parts.map((part, i) => {
        const img = inserts.get(i);
        return img ? part + img : part;
    }).join('');
}

// ─── Main endpoint ───────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        // ── Auth check ──
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
        }
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
        }

        const admin = getAdmin();

        const {
            topic, ctaUrl, brief,
            narrativeStyle = 'first-person',
            framework = 'modern-native',
            pixelId, slug: customSlug, domainId,
        } = await request.json();

        if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        if (!ctaUrl) return NextResponse.json({ error: 'CTA URL is required' }, { status: 400 });

        // ── STEP 1: Scrape CTA URL ──
        console.log('[advertorial] Step 1: Scraping CTA...');
        let productText = '';
        try {
            const pageRes = await fetch(ctaUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
                signal: AbortSignal.timeout(10000),
            });
            if (pageRes.ok) {
                const html = await pageRes.text();
                productText = html
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 5000);
            }
        } catch (e) {
            console.log('[advertorial] CTA scrape failed, continuing without product text');
        }
        console.log(`[advertorial] Product text: ${productText.length} chars`);

        // ── STEP 2: Claude Opus writes the article ──
        console.log('[advertorial] Step 2: Claude Opus writing...');

        const frameworkInst = framework === 'classic-dr'
            ? 'FRAMEWORK: Classic Direct Response (Schwartz, Halbert, Ogilvy, Hopkins). Structure: Big Promise > Proof > Mechanism > Social Proof > Urgency > CTA'
            : 'FRAMEWORK: Modern Native Ad (Brunson, Georgi, Kern). Structure: Hook > Relatable Story > Problem > Discovery > Unique Mechanism > Proof > Soft CTA';

        const narrativeInst = narrativeStyle === 'first-person'
            ? 'NARRATIVE: First-person story. Believable protagonist who experienced the problem and found the solution. Specific scenes, emotions, dialogue.'
            : 'NARRATIVE: Third-person investigative journalism. Reporter investigating a trend. Expert quotes, studies, data. Editorial objectivity leading to the product.';

        const briefInst = brief ? `\nBRIEF (follow closely): ${brief}` : '';

        const claudePrompt = `Write an advertorial article and return ONLY valid JSON — no markdown fences, no extra text.

TOPIC: ${topic}
PRODUCT PAGE (${ctaUrl}): ${productText}
${frameworkInst}
${narrativeInst}${briefInst}

RULES:
- 1500-2500 words. Genuine editorial feel, not an ad.
- Never say "ad"/"sponsored". Build emotion before product.
- Include 2-3 testimonial quotes. Soft CTA ending.

Return ONLY this JSON:
{"title":"Headline","subtitle":"Subheadline","author":"Name","reviewer":"Dr. Name, MD","date":"Updated: 2 hours ago","content":"<p>Full article as HTML with p/h2/h3/blockquote/strong/em/ul/ol tags. NO title/subtitle here.</p>","keyTakeaways":[{"title":"Title","content":"Sentence"},{"title":"Title","content":"Sentence"},{"title":"Title","content":"Sentence"}],"comments":[{"id":"c1","author":"Name","avatar":"https://picsum.photos/seed/c1/100","content":"Comment about the product","time":"2h","likes":45,"hasReplies":false,"isLiked":true},{"id":"c2","author":"Name","avatar":"https://picsum.photos/seed/c2/100","content":"Comment","time":"5h","likes":23,"hasReplies":false,"isLiked":false},{"id":"c3","author":"Name","avatar":"https://picsum.photos/seed/c3/100","content":"Comment","time":"8h","likes":67,"hasReplies":true,"isLiked":true},{"id":"c4","author":"Name","avatar":"https://picsum.photos/seed/c4/100","content":"Comment","time":"1d","likes":12,"hasReplies":false,"isLiked":false},{"id":"c5","author":"Name","avatar":"https://picsum.photos/seed/c5/100","content":"Comment","time":"1d","likes":34,"hasReplies":false,"isLiked":true}]}`;

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const claudeRes = await anthropic.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 16000,
            messages: [{ role: 'user', content: claudePrompt }],
        });

        const rawText = claudeRes.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('');

        console.log(`[advertorial] Claude response: ${rawText.length} chars`);

        let article;
        try {
            const jsonStr = rawText.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
            article = JSON.parse(jsonStr);
        } catch {
            console.error('[advertorial] JSON parse failed:', rawText.slice(0, 500));
            return NextResponse.json({ error: 'Failed to parse article. Try again.' }, { status: 500 });
        }

        // ── STEP 3: Generate 5 product-specific images ──
        console.log('[advertorial] Step 3: Generating 5 images...');

        // Extract text sections from the article for context
        const plainText = (article.content || '').replace(/<[^>]+>/g, '\n');
        const paragraphs = plainText.split('\n').filter((p: string) => p.trim().length > 40);
        const earlyText = paragraphs.slice(0, 4).join(' ').slice(0, 400);
        const midText = paragraphs.slice(Math.floor(paragraphs.length * 0.3), Math.floor(paragraphs.length * 0.5)).join(' ').slice(0, 400);
        const lateText = paragraphs.slice(Math.floor(paragraphs.length * 0.6), Math.floor(paragraphs.length * 0.8)).join(' ').slice(0, 400);
        const endText = paragraphs.slice(Math.floor(paragraphs.length * 0.8)).join(' ').slice(0, 400);

        const productBrief = productText.slice(0, 1500);
        const baseRule = 'Create a high-quality, photorealistic editorial photograph. Do NOT include any text, watermarks, logos, or words in the image. The image must look like a real photograph, not AI-generated.';

        const imagePrompts = [
            // Hero image — dramatic, product-related
            `${baseRule}\n\nThis is the HERO image for an advertorial about: "${article.title}"\nThe product being advertised: ${productBrief.slice(0, 500)}\n\nCreate a dramatic, cinematic lifestyle photograph that captures the essence of this product and its benefits. The image should make someone want to read the article. Show a real-life scene related to the product's use case.`,

            // Early article — the problem/pain point
            `${baseRule}\n\nThis image illustrates the PROBLEM discussed in an advertorial. The product being advertised is from: ${ctaUrl}\nProduct info: ${productBrief.slice(0, 300)}\nArticle context around this image: "${earlyText}"\n\nShow an emotional, relatable scene depicting the struggle or pain point that the product solves. Real person, real emotion, real setting.`,

            // Mid article — the science/mechanism/discovery
            `${baseRule}\n\nThis image illustrates the SCIENCE or MECHANISM behind a product. Product: ${productBrief.slice(0, 300)}\nArticle context: "${midText}"\n\nShow something that conveys scientific credibility — could be ingredients, a close-up of the product itself, a laboratory setting, natural ingredients on a clean surface, or a medical/wellness professional. Make it feel authoritative and trustworthy.`,

            // Solution section — the product in action
            `${baseRule}\n\nThis image shows the SOLUTION — the product in use. Product from: ${ctaUrl}\nProduct info: ${productBrief.slice(0, 300)}\nArticle context: "${lateText}"\n\nShow a real person happily using or benefiting from this type of product. Lifestyle photography — warm, inviting, authentic. The person should look satisfied, healthy, and genuine.`,

            // Results section — transformation/success
            `${baseRule}\n\nThis image conveys RESULTS and TRANSFORMATION. Product: ${productBrief.slice(0, 300)}\nArticle context: "${endText}"\n\nShow the positive outcome — a person who looks transformed, confident, and happy. Could be a before/after feeling, someone celebrating a milestone, or a group of happy people. Warm golden-hour lighting, genuine emotions.`,
        ];

        // Generate all 5 images in parallel
        const imageResults = await Promise.all(
            imagePrompts.map(p => generateAndUpload(p, admin))
        );

        const successCount = imageResults.filter(Boolean).length;
        console.log(`[advertorial] Generated ${successCount}/5 images`);

        // ── STEP 4: Assemble final article ──
        const heroImage = imageResults[0];
        const inlineImages = imageResults.slice(1).filter(Boolean) as string[];

        // Insert inline images into the HTML content
        let finalContent = article.content;
        if (inlineImages.length > 0) {
            finalContent = insertImagesIntoHtml(article.content, heroImage, inlineImages);
        }

        // Determine slug
        let slug = customSlug;
        if (!slug) {
            slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        } else {
            slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        }

        // Check for existing slug
        const { data: existing } = await admin.from('articles').select('slug').eq('slug', slug).single();
        if (existing) {
            slug = `${slug}-${Math.random().toString(36).substring(7)}`;
        }

        // ── STEP 5: Save to database ──
        console.log('[advertorial] Step 5: Saving to DB...');

        const { error: insertError } = await admin.from('articles').insert({
            slug,
            title: article.title,
            subtitle: article.subtitle,
            author: article.author,
            reviewer: article.reviewer,
            date: article.date,
            content: finalContent,
            key_takeaways: article.keyTakeaways,
            comments: article.comments,
            image: heroImage || `https://picsum.photos/seed/${slug}/800/600`,
            cta_text: 'Check Availability \u00BB',
            cta_title: 'Curious about the science?',
            cta_description: 'Secure, verified link to official research.',
            pixel_id: pixelId || '',
            cta_url: ctaUrl || '',
            article_theme: 'v1',
            domain_id: domainId || null,
            updated_at: new Date().toISOString(),
        });

        if (insertError) {
            console.error('[advertorial] DB insert error:', insertError);
            throw insertError;
        }

        console.log(`[advertorial] Done! Slug: ${slug}, Images: ${successCount}/5`);

        return NextResponse.json({
            success: true,
            slug,
            imagesGenerated: successCount,
        });

    } catch (error: any) {
        console.error('[advertorial] Fatal error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate advertorial' },
            { status: 500 }
        );
    }
}
