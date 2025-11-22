import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

        const { rawText, pixelId, ctaUrl, slug: customSlug } = await request.json();

        if (!rawText) {
            return NextResponse.json({ error: 'Raw text is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
            You are an expert content formatter and HTML structurer.
            
            YOUR TASK:
            Take the provided RAW TEXT and format it into a JSON object for a health news site.
            
            CRITICAL RULE: ** DO NOT REWRITE THE CONTENT.**
            -   You must use the EXACT wording from the raw text.
            - Do NOT summarize, do NOT "optimize", do NOT change the tone.
            - Your ONLY job is to apply HTML tags and extract the structure.
            
            INSTRUCTIONS FOR PARSING:
        1. ** Headline **: Identify the main headline(usually the first line).Extract it exactly.
            2. ** Subheadline **: Identify the subheadline(usually the second line).Extract it exactly.
            3. ** Body Content **:
        -   Take the rest of the text and format it as clean, semantic HTML.
                - Use<h2> for major section breaks.
                - Use<h3> for sub - sections.
                - Use<blockquote> for testimonials, key quotes, or "callout" boxes.
                - Use < ul > or<ol> for lists.
                - Use < strong > and<em> for emphasis.
                -   ** DO NOT ** include the title or subtitle in the "content" field.
                -   ** DO NOT CHANGE A SINGLE WORD OF THE BODY TEXT.**
            4. ** Key Takeaways **: Extract 3 distinct, punchy "Key Takeaways" from the text. (You may summarize here, but keep it close to the text).
            5. ** Comments **: Generate 4 - 7 realistic comments from women(ages 35 - 65) discussing the topic / product.They should sound natural, not like bots.

            OUTPUT JSON SCHEMA:
        {
            "title": "The Main Headline (Exact Match)",
            "subtitle": "The Subheadline (Exact Match)",
            "author": "Female Name (e.g. Sarah Jenkins)",
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
            // Sanitize custom slug
            slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        }

        const newArticle = {
            slug: slug,
            title: generatedData.title,
            subtitle: generatedData.subtitle,
            author: generatedData.author,
            reviewer: generatedData.reviewer,
            date: generatedData.date,
            content: generatedData.content,
            key_takeaways: generatedData.keyTakeaways,
            comments: generatedData.comments,
            image: "https://picsum.photos/seed/" + slug + "/800/600", // Placeholder
            cta_text: "Check Availability »",
            cta_title: "Curious about the science?",
            cta_description: "Secure, verified link to official research.",
            pixel_id: pixelId || "",
            cta_url: ctaUrl || "",
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
