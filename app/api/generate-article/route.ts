import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

        const { rawText, pixelId, ctaUrl, slug: customSlug } = await request.json();

        if (!rawText) {
            return NextResponse.json({ error: 'Raw text is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
            You are an expert direct-response copywriter and content formatter.
            
            YOUR TASK:
            Take the provided RAW TEXT and structure it into a JSON object for a high-converting health news article.
            
            CRITICAL INSTRUCTIONS FOR PARSING:
            1.  **Headline**: Identify the main headline. It is usually the first line or the most prominent statement at the top.
            2.  **Subheadline**: Identify the subheadline. It usually follows the headline and elaborates on the promise.
            3.  **Body Content**: 
                -   Format the rest of the text as clean, semantic HTML.
                -   Use <h2> for major section breaks.
                -   Use <h3> for sub-sections.
                -   Use <blockquote> for testimonials, key quotes, or "callout" boxes.
                -   Use <ul> or <ol> for lists.
                -   Use <strong> and <em> for emphasis.
                -   **DO NOT** include the title or subtitle in the "content" field.
            4.  **Key Takeaways**: Extract 3 distinct, punchy "Key Takeaways" from the text.
            5.  **Comments**: Generate 4-7 realistic comments from women (ages 35-65) discussing the topic/product. They should sound natural, not like bots.

            OUTPUT JSON SCHEMA:
            {
                "title": "The Main Headline",
                "subtitle": "The Subheadline",
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
            id: slug,
            slug: slug,
            ...generatedData,
            image: "https://picsum.photos/seed/" + slug + "/800/600", // Placeholder
            ctaText: "Check Availability »",
            ctaTitle: "Curious about the science?",
            ctaDescription: "Secure, verified link to official research.",
            pixelId: pixelId || "",
            ctaUrl: ctaUrl || ""
        };

        // Save to file
        const filePath = path.join(process.cwd(), 'data', 'articles.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        const articles = JSON.parse(fileData);

        // Check if slug exists and append random string if so (only if auto-generated or collision)
        let finalSlug = slug;
        if (articles.some((a: any) => a.slug === finalSlug)) {
            finalSlug = `${slug}-${Math.random().toString(36).substring(7)}`;
            newArticle.slug = finalSlug;
            newArticle.id = finalSlug;
        }

        articles.push(newArticle);
        fs.writeFileSync(filePath, JSON.stringify(articles, null, 4));

        return NextResponse.json({ success: true, slug: finalSlug });

    } catch (error) {
        console.error('Error generating article:', error);
        return NextResponse.json(
            { error: 'Failed to generate article' },
            { status: 500 }
        );
    }
}
