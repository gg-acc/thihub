import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 300;

const IMAGE_MODELS = ['nano-banana-pro-preview', 'gemini-2.5-flash-image'];

async function callImageModel(model: string, prompt: string, apiKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
        const response = await fetch(
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

        if (!response.ok) {
            console.log(`[images] ${model} returned ${response.status}`);
            return null;
        }
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
        if (!imagePart?.inlineData) {
            console.log(`[images] ${model} returned no image data`);
            return null;
        }

        return {
            buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
            mimeType: imagePart.inlineData.mimeType,
        };
    } catch (err) {
        console.error(`[images] ${model} threw error:`, err);
        return null;
    }
}

async function generateAndUploadImage(prompt: string, supabase: any): Promise<string | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        let result: { buffer: Buffer; mimeType: string } | null = null;
        for (const model of IMAGE_MODELS) {
            result = await callImageModel(model, prompt, apiKey);
            if (result) {
                console.log(`[images] Used model: ${model}`);
                break;
            }
            console.log(`[images] ${model} failed, trying next...`);
        }

        if (!result) {
            console.log('[images] All models failed for this prompt');
            return null;
        }

        const ext = result.mimeType === 'image/png' ? 'png' : 'jpg';
        const fileName = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, result.buffer, { contentType: result.mimeType, cacheControl: '3600', upsert: false });
        if (uploadError) {
            console.error('[images] Upload error:', uploadError);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(fileName);
        console.log('[images] Uploaded:', publicUrl);
        return publicUrl;
    } catch (err) {
        console.error('[images] generateAndUploadImage error:', err);
        return null;
    }
}

// Replace <figure data-image-index="N"></figure> placeholders with actual images
function fillImagePlaceholders(contentHtml: string, imageUrls: (string | null)[]): string {
    let result = contentHtml;
    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        if (url) {
            result = result.replace(
                new RegExp(`<figure\\s+data-image-index="${i}"\\s*>\\s*</figure>`, 'i'),
                `<figure class="my-8"><img src="${url}" alt="" class="w-full rounded-lg shadow-md" /></figure>`
            );
        } else {
            // Remove unfilled placeholder
            result = result.replace(
                new RegExp(`<figure\\s+data-image-index="${i}"\\s*>\\s*</figure>`, 'i'),
                ''
            );
        }
    }
    return result;
}

// Fallback: insert images at natural break points if no placeholders exist
function insertInlineImages(contentHtml: string, imageUrls: string[]): string {
    if (imageUrls.length === 0) return contentHtml;

    const blocks = contentHtml.split(/(<\/(?:p|h[2-6]|blockquote|div|ul|ol)>)/i);
    const closingTagIndices: number[] = [];
    for (let i = 0; i < blocks.length; i++) {
        if (/^<\/(?:p|h[2-6]|blockquote|div|ul|ol)>$/i.test(blocks[i])) {
            closingTagIndices.push(i);
        }
    }

    if (closingTagIndices.length < 2) return contentHtml;

    const startIdx = Math.max(2, Math.floor(closingTagIndices.length * 0.1));
    const availableSlots = closingTagIndices.slice(startIdx);
    const step = Math.max(1, Math.floor(availableSlots.length / imageUrls.length));

    const insertions = new Map<number, string>();
    for (let i = 0; i < imageUrls.length && i * step < availableSlots.length; i++) {
        const slotIndex = availableSlots[i * step];
        insertions.set(slotIndex, `<figure class="my-8"><img src="${imageUrls[i]}" alt="" class="w-full rounded-lg shadow-md" /></figure>`);
    }

    return blocks.map((block, i) => {
        const img = insertions.get(i);
        return img ? block + img : block;
    }).join('');
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug, imagePrompts, productContext } = await request.json();

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        // Fetch the article
        const { data: article, error: fetchError } = await supabase
            .from('articles')
            .select('*')
            .eq('slug', slug)
            .single();

        if (fetchError || !article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Use Claude's specific image prompts if provided, otherwise build generic ones
        let prompts: string[];
        const baseRule = 'Create a high-quality, photorealistic image. Do NOT include any text, watermarks, logos, or words in the image.';

        if (imagePrompts && imagePrompts.length > 0) {
            console.log(`[images] Using ${imagePrompts.length} Claude-generated image prompts`);
            prompts = imagePrompts.map((p: string) => `${baseRule}\n\n${p}`);
        } else {
            // Fallback: generic prompts based on article content
            console.log('[images] No image prompts from Claude, using generic prompts');
            const productInfo = productContext ? `\n\nPRODUCT CONTEXT:\n${productContext}` : '';
            const contentText = (article.content || '').replace(/<[^>]+>/g, '\n');
            const paragraphs = contentText.split('\n').filter((p: string) => p.trim().length > 50);

            prompts = [
                `${baseRule}\n\nHERO image for article titled "${article.title}" — "${article.subtitle}". Dramatic, cinematic, lifestyle scene.${productInfo}`,
                `${baseRule}\n\nEditorial image for middle of article about "${article.title}". Context: "${paragraphs.slice(Math.floor(paragraphs.length * 0.3), Math.floor(paragraphs.length * 0.5)).join(' ').slice(0, 300)}".${productInfo}`,
                `${baseRule}\n\nImage for the results section of "${article.title}". Context: "${paragraphs.slice(Math.floor(paragraphs.length * 0.7)).join(' ').slice(0, 300)}". Convey transformation, satisfaction.${productInfo}`,
            ];
        }

        console.log(`[images] Generating ${prompts.length} images for: ${slug}`);
        const imageResults = await Promise.all(
            prompts.map(p => generateAndUploadImage(p, supabase))
        );

        const successCount = imageResults.filter(Boolean).length;
        console.log(`[images] Generated ${successCount}/${prompts.length} images`);

        // Update article
        const updates: any = { updated_at: new Date().toISOString() };

        // Hero image = first result
        if (imageResults[0]) {
            updates.image = imageResults[0];
        }

        // Check if content has placeholders from Claude
        const hasPlaceholders = /data-image-index=/.test(article.content || '');

        if (hasPlaceholders) {
            // Fill the placeholder tags Claude placed in the HTML
            updates.content = fillImagePlaceholders(article.content, imageResults);
        } else {
            // Fallback: insert inline images at break points (skip hero = index 0)
            const inlineImages = imageResults.slice(1).filter(Boolean) as string[];
            if (inlineImages.length > 0) {
                updates.content = insertInlineImages(article.content, inlineImages);
            }
        }

        const { error: updateError } = await supabase
            .from('articles')
            .update(updates)
            .eq('slug', slug);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            imagesGenerated: successCount,
        });
    } catch (error) {
        console.error('Error generating images:', error);
        return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 });
    }
}
