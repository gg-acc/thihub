import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 60; // Max for Vercel Hobby plan

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─── CTA URL Scraping & Analysis ───────────────────────────────────────────

async function analyzeCtaUrl(ctaUrl: string): Promise<string | null> {
    if (!ctaUrl || !ctaUrl.startsWith('http')) return null;

    try {
        // Fetch the landing page
        const res = await fetch(ctaUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) return null;

        const html = await res.text();

        // Strip scripts, styles, and extract text content
        const textContent = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000); // Limit to avoid token overflow

        // Use Gemini to analyze the product page
        const model = genAI.getGenerativeModel({ model: 'nano-banana-pro-preview' });
        const analysisPrompt = `Analyze this product landing page text and provide a concise product brief. Extract:
1. Product name
2. What the product is (type, category)
3. Key benefits/features (bullet points)
4. Target audience
5. Visual elements that would represent this product well (colors, imagery, lifestyle associations)
6. The core problem this product solves

Be concise. This will be used to generate relevant editorial images for an advertorial article about this product.

PAGE CONTENT:
${textContent}`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
        });

        return result.response.text();
    } catch (error) {
        console.error('CTA analysis error:', error);
        return null;
    }
}

// ─── Image Generation ──────────────────────────────────────────────────────

const IMAGE_MODELS = ['nano-banana-pro-preview', 'gemini-2.5-flash-image'];

async function callImageModel(model: string, prompt: string, apiKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
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

    if (!response.ok) return null;
    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imagePart?.inlineData) return null;

    return {
        buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
        mimeType: imagePart.inlineData.mimeType,
    };
}

async function generateAndUploadImage(
    prompt: string,
    supabase: any
): Promise<string | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        // Try models with fallback
        let result: { buffer: Buffer; mimeType: string } | null = null;
        for (const model of IMAGE_MODELS) {
            result = await callImageModel(model, prompt, apiKey);
            if (result) {
                console.log(`[images] Used model: ${model}`);
                break;
            }
            console.log(`[images] ${model} failed, trying next...`);
        }

        if (!result) return null;

        const ext = result.mimeType === 'image/png' ? 'png' : 'jpg';
        const fileName = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase
            .storage
            .from('article-images')
            .upload(fileName, result.buffer, {
                contentType: result.mimeType,
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return null;
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('article-images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Image generation error:', error);
        return null;
    }
}

// Generate multiple image prompts based on article content + product context
function buildImagePrompts(
    title: string,
    subtitle: string,
    contentHtml: string,
    productContext: string | null
): string[] {
    const productInfo = productContext
        ? `\n\nPRODUCT CONTEXT (from the CTA landing page - use this to make images relevant to the product being sold):\n${productContext}`
        : '';

    const baseStyle = 'Create a high-quality, photorealistic editorial photograph. The image should look like a professional stock photo for a premium online magazine. Style: Clean, modern, well-lit, editorial photography. Do NOT include any text, watermarks, logos, or words in the image.';

    // Extract paragraph text to understand article sections
    const paragraphs = contentHtml
        .replace(/<[^>]+>/g, '\n')
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 50);

    const prompts: string[] = [];

    // 1. Hero image - dramatic, eye-catching, relates to the article topic + product
    prompts.push(
        `${baseStyle}\n\nThis is the HERO image (main banner) for an editorial article titled "${title}" with subtitle "${subtitle}". Make it dramatic, cinematic, and attention-grabbing. Show a lifestyle scene that captures the essence of the article topic.${productInfo}`
    );

    // 2. Early article image - the "problem" or context image
    const earlyContext = paragraphs.slice(0, 3).join(' ').slice(0, 300);
    prompts.push(
        `${baseStyle}\n\nThis image appears early in an editorial article. It should visually represent the PROBLEM or situation being discussed. Article context: "${earlyContext}". Show a relatable, emotional lifestyle photo.${productInfo}`
    );

    // 3. Mid-article image - scientific/educational feel
    const midContext = paragraphs.slice(Math.floor(paragraphs.length * 0.3), Math.floor(paragraphs.length * 0.5)).join(' ').slice(0, 300);
    prompts.push(
        `${baseStyle}\n\nThis image appears in the middle of an editorial article during the educational/scientific explanation section. Article context: "${midContext}". Show something that conveys research, science, or expertise - like a lab setting, close-up of natural ingredients, or a medical professional.${productInfo}`
    );

    // 4. Solution/product-adjacent image
    prompts.push(
        `${baseStyle}\n\nThis image appears in the "solution" section of an editorial article titled "${title}". It should convey hope, transformation, or a positive outcome. Show a person looking confident, healthy, and happy - or a lifestyle scene that represents the desired result.${productInfo}`
    );

    // 5. Late article image - results/transformation/social proof
    const lateContext = paragraphs.slice(Math.floor(paragraphs.length * 0.7)).join(' ').slice(0, 300);
    prompts.push(
        `${baseStyle}\n\nThis image appears near the end of an editorial article, in the results/testimonials section. Article context: "${lateContext}". Show something that conveys real results, satisfaction, or a before-and-after transformation feeling. Lifestyle photography.${productInfo}`
    );

    return prompts;
}

// Insert inline images into article HTML at natural break points
function insertInlineImages(contentHtml: string, imageUrls: string[]): string {
    if (imageUrls.length === 0) return contentHtml;

    // Split content by paragraphs / block elements
    const blocks = contentHtml.split(/(<\/(?:p|h[2-6]|blockquote|div|ul|ol)>)/i);

    if (blocks.length < 4) {
        // Very short article - just append images
        const imgs = imageUrls.map(url =>
            `<figure class="my-8"><img src="${url}" alt="" class="w-full rounded-lg shadow-md" /></figure>`
        ).join('');
        return contentHtml + imgs;
    }

    // Calculate insertion points spread evenly through the article
    // We want to insert after closing tags, not in the middle of elements
    const closingTagIndices: number[] = [];
    for (let i = 0; i < blocks.length; i++) {
        if (/^<\/(?:p|h[2-6]|blockquote|div|ul|ol)>$/i.test(blocks[i])) {
            closingTagIndices.push(i);
        }
    }

    if (closingTagIndices.length < 2) {
        return contentHtml;
    }

    // Space images evenly, skip the first couple of paragraphs
    const startIdx = Math.max(2, Math.floor(closingTagIndices.length * 0.1));
    const availableSlots = closingTagIndices.slice(startIdx);
    const step = Math.max(1, Math.floor(availableSlots.length / imageUrls.length));

    const insertions = new Map<number, string>();
    for (let i = 0; i < imageUrls.length && i * step < availableSlots.length; i++) {
        const slotIndex = availableSlots[i * step];
        insertions.set(slotIndex, `<figure class="my-8"><img src="${imageUrls[i]}" alt="" class="w-full rounded-lg shadow-md" /></figure>`);
    }

    // Rebuild the HTML with images inserted
    return blocks.map((block, i) => {
        const img = insertions.get(i);
        return img ? block + img : block;
    }).join('');
}

// For V2: replace image_placeholder components with real images
function fillV2ImagePlaceholders(components: any[], imageUrls: string[]): any[] {
    let imageIndex = 0;
    return components.map(comp => {
        if (comp.type === 'image_placeholder' && imageIndex < imageUrls.length) {
            const url = imageUrls[imageIndex++];
            return { type: 'image', url };
        }
        return comp;
    });
}

// ─── Prompts ───────────────────────────────────────────────────────────────

const getV1Prompt = (rawText: string, productContext: string | null) => {
    const productSection = productContext
        ? `\n\nPRODUCT CONTEXT (from the CTA landing page - the article is a prelander for this product):\n${productContext}\n\nUse this context to make comments and key takeaways more relevant to the product being sold.`
        : '';

    return `
            You are an expert content formatter and HTML structurer.

            YOUR TASK:
            Take the provided RAW TEXT and format it into a JSON object for a news/editorial site.

            CRITICAL RULE: ** DO NOT REWRITE THE CONTENT.**
            -   You must use the EXACT wording from the raw text.
            - Do NOT summarize, do NOT "optimize", do NOT change the tone.
            - Your ONLY job is to apply HTML tags and extract the structure.

            INSTRUCTIONS FOR PARSING:
        1. ** Headline **: Identify the main headline(usually the first line).Extract it exactly.
            2. ** Subheadline **: Identify the subheadline(usually the second line).Extract it exactly.
            3. ** Body Content **:
                -   Take the rest of the text and format it as clean, semantic HTML.
                -   **CRITICAL**: Do NOT add any new text, introductory phrases, or concluding remarks.
                -   **CRITICAL**: Do NOT invent new headlines or subheadlines if they are not in the source text.
                -   If a line looks like a subheadline (short, bold, or separate line), use <h2> or <h3>.
                -   Use <blockquote> for testimonials, key quotes, or "callout" boxes.
                -   Use <ul> or <ol> for lists.
                -   Use <strong> and <em> for emphasis.
                -   ** DO NOT ** include the title or subtitle in the "content" field.
                -   ** DO NOT CHANGE A SINGLE WORD OF THE BODY TEXT.**
            4. ** Key Takeaways **: Extract 3 distinct, punchy "Key Takeaways" from the text. (You may summarize here, but keep it close to the text).
            5. ** Comments **: Generate 4 - 7 realistic comments from people discussing the topic / product. They should sound natural, not like bots.
            ${productSection}

            OUTPUT JSON SCHEMA:
        {
            "title": "The Main Headline (Exact Match)",
            "subtitle": "The Subheadline (Exact Match)",
            "author": "Name (e.g. Sarah Jenkins)",
            "reviewer": "Medical Doctor Name (e.g. Dr. A. Peterson, MD)",
            "date": "Updated: 2 hours ago",
            "content": "<p>First paragraph...</p>...",
            "keyTakeaways": [
                { "title": "Short Title", "content": "One sentence summary" }
            ],
            "comments": [
                {
                    "id": "c1",
                    "author": "Name",
                    "avatar": "https://picsum.photos/seed/c1/100",
                    "content": "Comment text",
                    "time": "2h",
                    "likes": 45,
                    "hasReplies": false,
                    "isLiked": true
                }
            ]
        }

            RAW TEXT:
            ${rawText}
        `;
};

const getV2Prompt = (rawText: string, productContext: string | null) => {
    const productSection = productContext
        ? `\n\nPRODUCT CONTEXT (from the CTA landing page - the article is a prelander for this product):\n${productContext}\n\nUse this context to make comments and key takeaways more relevant.`
        : '';

    return `
You are an expert content analyzer for high-conversion advertorials.

YOUR TASK:
Analyze the provided RAW TEXT and structure it into rich UI components. DO NOT rewrite or change any text - only categorize and wrap existing content into the appropriate component types.

CRITICAL RULES:
1. ** PRESERVE ALL TEXT VERBATIM ** - Do not change a single word of the original content
2. Your job is to DETECT the context/intent of each paragraph and assign it a component type
3. The text content inside each component must be EXACTLY from the source
4. Include 4-6 "image_placeholder" components distributed throughout the article at natural visual break points

COMPONENT TYPES TO USE:
- "paragraph" - Standard text paragraphs
- "heading" - Section headers (h2, h3 level)
- "icon_list" - When text describes multiple benefits, features, or points
- "comparison_table" - When text compares product vs competitors or lists advantages
- "timeline" - When text describes a journey, progression, or "week 1, week 2" style results
- "testimonial" - Customer quotes, reviews, or personal stories
- "image_placeholder" - Place these at strategic points where a visual would enhance the story (MUST include 4-6 of these)
- "blockquote" - Important callouts or highlighted statements

IMAGE PLACEHOLDER GUIDELINES:
- Place first image_placeholder after the opening 2-3 paragraphs
- Place one in the "problem" section
- Place one in the "science/explanation" section
- Place one in the "solution" section
- Place one near testimonials/results
- Each should have a descriptive "searchQuery" that describes what the image should show
${productSection}

OUTPUT JSON SCHEMA:
{
    "title": "The Main Headline (Exact Match)",
    "subtitle": "The Subheadline (Exact Match)",
    "author": "Name",
    "reviewer": "Medical Doctor Name (e.g. Dr. A. Peterson, MD)",
    "date": "Updated: 2 hours ago",
    "articleTheme": "v2",
    "components": [
        {
            "type": "paragraph",
            "content": "Exact paragraph text from source..."
        },
        {
            "type": "heading",
            "level": 2,
            "content": "Section Title"
        },
        {
            "type": "image_placeholder",
            "searchQuery": "descriptive scene description for image generation"
        },
        {
            "type": "icon_list",
            "items": [
                { "icon": "bacteria", "title": "Short Title", "text": "The exact text about this point..." }
            ]
        },
        {
            "type": "comparison_table",
            "ourBrand": "Our Formula",
            "theirBrand": "Generic Brands",
            "features": [
                { "name": "Feature from text", "us": true, "them": false }
            ]
        },
        {
            "type": "timeline",
            "title": "Your Journey",
            "weeks": [
                { "week": 1, "title": "Week 1 Title", "description": "Exact description..." }
            ]
        },
        {
            "type": "testimonial",
            "helpedWith": "Category",
            "title": "Testimonial headline if any",
            "body": "The exact quote or review text...",
            "author": "Name from text or generate realistic name"
        },
        {
            "type": "blockquote",
            "content": "Important statement to highlight..."
        }
    ],
    "keyTakeaways": [
        { "title": "Short Title", "content": "One sentence summary" }
    ],
    "comments": [
        {
            "id": "c1",
            "author": "Name",
            "avatar": "https://picsum.photos/seed/c1/100",
            "content": "Comment text",
            "time": "2h",
            "likes": 45,
            "hasReplies": false,
            "isLiked": true
        }
    ]
}

ICON KEYWORDS FOR icon_list:
- gut, stomach, digestion -> digestive topics
- bacteria, probiotic, biofilm -> microbiome topics
- immune, immunity, shield -> immune system
- energy, zap -> energy/vitality
- sleep, moon -> sleep quality
- brain -> cognitive function
- heart -> cardiovascular
- inflammation, flame -> inflammation
- vitamin, pill -> supplements
- natural, leaf -> natural ingredients
- quality, certified, tested -> quality assurance
- warning, danger -> concerns/problems
- check, star -> benefits/positives

RAW TEXT:
${rawText}
`;
};

// ─── Main Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not set in environment variables.' },
                { status: 500 }
            );
        }

        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { rawText, pixelId, ctaUrl, slug: customSlug, theme = 'v1', domainId } = await request.json();

        if (!rawText) {
            return NextResponse.json({ error: 'Raw text is required' }, { status: 400 });
        }

        // Step 1: Analyze the CTA URL in parallel with nothing blocking it
        console.log('[generate] Analyzing CTA URL:', ctaUrl);
        const productContext = await analyzeCtaUrl(ctaUrl);
        if (productContext) {
            console.log('[generate] Product context extracted successfully');
        }

        // Step 2: Generate article content with product context
        const model = genAI.getGenerativeModel({ model: 'nano-banana-pro-preview' });
        const prompt = theme === 'v2'
            ? getV2Prompt(rawText, productContext)
            : getV1Prompt(rawText, productContext);

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const response = result.response;
        const text = response.text();
        const generatedData = JSON.parse(text);

        // Determine Slug
        let slug = customSlug;
        if (!slug) {
            slug = generatedData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        } else {
            slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        }

        // Step 3: Process content based on theme
        let finalContent: string;

        if (theme === 'v2' && generatedData.components) {
            finalContent = convertV2ComponentsToHTML(generatedData.components);
        } else {
            finalContent = generatedData.content;
        }

        // Step 4: Build image prompts based on article + product context
        const imagePrompts = buildImagePrompts(
            generatedData.title,
            generatedData.subtitle || '',
            finalContent,
            productContext
        );

        // Step 5: Generate all images in parallel (hero + 4 inline)
        console.log(`[generate] Generating ${imagePrompts.length} images in parallel...`);
        const imageResults = await Promise.all(
            imagePrompts.map(p => generateAndUploadImage(p, supabase))
        );

        const heroImage = imageResults[0];
        const inlineImages = imageResults.slice(1).filter(Boolean) as string[];
        console.log(`[generate] Generated ${inlineImages.length + (heroImage ? 1 : 0)} images successfully`);

        // Step 6: Insert inline images into the article content
        if (theme === 'v2' && generatedData.components) {
            // For V2, replace image_placeholder components with real images
            const filledComponents = fillV2ImagePlaceholders(generatedData.components, inlineImages);
            finalContent = convertV2ComponentsToHTML(filledComponents);
        } else {
            // For V1, insert images at natural break points in HTML
            finalContent = insertInlineImages(finalContent, inlineImages);
        }

        const newArticle = {
            slug: slug,
            title: generatedData.title,
            subtitle: generatedData.subtitle,
            author: generatedData.author,
            reviewer: generatedData.reviewer,
            date: generatedData.date,
            content: finalContent,
            key_takeaways: generatedData.keyTakeaways,
            comments: generatedData.comments,
            image: heroImage || "https://picsum.photos/seed/" + slug + "/800/600",
            cta_text: "Check Availability \u00BB",
            cta_title: "Curious about the science?",
            cta_description: "Secure, verified link to official research.",
            pixel_id: pixelId || "",
            cta_url: ctaUrl || "",
            article_theme: theme,
            domain_id: domainId || null,
            updated_at: new Date().toISOString()
        };

        // Check if slug exists
        const { data: existing } = await supabase
            .from('articles')
            .select('slug')
            .eq('slug', slug)
            .single();

        if (existing) {
            newArticle.slug = `${slug}-${Math.random().toString(36).substring(7)}`;
        }

        const { error } = await supabase
            .from('articles')
            .insert(newArticle);

        if (error) throw error;

        return NextResponse.json({ success: true, slug: newArticle.slug });

    } catch (error) {
        console.error('Error generating article:', error);
        return NextResponse.json(
            { error: 'Failed to generate article' },
            { status: 500 }
        );
    }
}

// ─── V2 HTML Conversion ───────────────────────────────────────────────────

function convertV2ComponentsToHTML(components: any[]): string {
    return components.map(component => {
        switch (component.type) {
            case 'paragraph':
                return `<p>${component.content}</p>`;

            case 'heading':
                const level = component.level || 2;
                return `<h${level}>${component.content}</h${level}>`;

            case 'image':
                return `<figure class="my-8"><img src="${component.url}" alt="" class="w-full rounded-lg shadow-md" /></figure>`;

            case 'icon_list':
                const iconListData = JSON.stringify(component.items);
                return `<div data-type="icon-list" data-items='${iconListData}' data-columns="${component.columns || 2}"></div>`;

            case 'comparison_table':
                const tableData = JSON.stringify(component.features);
                return `<div data-type="comparison-table" data-features='${tableData}' data-our-brand="${component.ourBrand || 'Our Formula'}" data-their-brand="${component.theirBrand || 'Generic Brands'}"></div>`;

            case 'timeline':
                const timelineData = JSON.stringify(component.weeks);
                return `<div data-type="timeline" data-weeks='${timelineData}' data-title="${component.title || 'Your Journey'}"></div>`;

            case 'testimonial':
                return `<div data-type="testimonial" data-helped-with="${component.helpedWith || 'Overall Health'}" data-title="${component.title || ''}" data-body="${escapeHtml(component.body)}" data-author="${component.author || 'Anonymous'}"></div>`;

            case 'image_placeholder':
                // Unfilled placeholder - use a subtle placeholder
                return `<figure class="my-8"><img src="https://picsum.photos/seed/${encodeURIComponent(component.searchQuery || 'article')}/800/500" alt="" class="w-full rounded-lg shadow-md" /></figure>`;

            case 'blockquote':
                return `<blockquote>${component.content}</blockquote>`;

            default:
                return `<p>${component.content || ''}</p>`;
        }
    }).join('\n');
}

function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
