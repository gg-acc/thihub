import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 120;

const IMAGE_MODELS = ['nano-banana-pro-preview', 'gemini-2.5-flash-image'];

export async function GET() {
    const results: string[] = [];

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        results.push(`GEMINI_API_KEY: ${apiKey ? 'SET (' + apiKey.slice(0, 10) + '...)' : 'MISSING'}`);
        results.push(`SUPABASE_URL: ${supaUrl ? 'SET' : 'MISSING'}`);
        results.push(`SERVICE_ROLE_KEY: ${serviceKey ? 'SET (' + serviceKey.slice(0, 10) + '...)' : 'MISSING'}`);

        if (!apiKey || !supaUrl || !serviceKey) {
            return NextResponse.json({ results, error: 'Missing env vars' });
        }

        // Test 1: Try each image model
        for (const model of IMAGE_MODELS) {
            results.push(`\n--- Testing ${model} ---`);
            try {
                const start = Date.now();
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: 'A cozy blanket on a chair. No text.' }] }],
                            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
                        }),
                    }
                );
                const elapsed = Date.now() - start;

                if (!res.ok) {
                    const errText = await res.text();
                    results.push(`${model}: HTTP ${res.status} (${elapsed}ms) - ${errText.slice(0, 200)}`);
                    continue;
                }

                const data = await res.json();
                const parts = data.candidates?.[0]?.content?.parts || [];
                const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

                if (!imgPart?.inlineData) {
                    results.push(`${model}: OK but no image data (${elapsed}ms)`);
                    continue;
                }

                const imgSize = imgPart.inlineData.data.length;
                results.push(`${model}: IMAGE OK - ${imgPart.inlineData.mimeType} - ${imgSize} base64 chars (${elapsed}ms)`);

                // Test 2: Try uploading to Supabase storage
                results.push(`\n--- Testing Supabase upload ---`);
                const admin = createSupabaseClient(supaUrl, serviceKey);
                const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
                const fileName = `test-${Date.now()}.png`;

                const { data: uploadData, error: uploadError } = await admin.storage
                    .from('article-images')
                    .upload(fileName, buffer, {
                        contentType: imgPart.inlineData.mimeType,
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    results.push(`Upload FAILED: ${JSON.stringify(uploadError)}`);
                } else {
                    results.push(`Upload OK: ${JSON.stringify(uploadData)}`);

                    const { data: { publicUrl } } = admin.storage
                        .from('article-images')
                        .getPublicUrl(fileName);
                    results.push(`Public URL: ${publicUrl}`);
                }

                // Only test first working model
                break;

            } catch (err: any) {
                results.push(`${model}: EXCEPTION - ${err.message}`);
            }
        }

    } catch (err: any) {
        results.push(`FATAL: ${err.message}`);
    }

    return NextResponse.json({ results });
}
