import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export interface CtaUrl {
    id: string;
    url: string;
    name: string;
    created_at: string;
}

// Helper to extract domain from URL
function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

// GET /api/ctas - Get all CTAs
export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data: ctas, error } = await supabase
            .from('cta_urls')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(ctas || []);
    } catch (e) {
        console.error('Error fetching CTAs:', e);
        return NextResponse.json({ error: 'Failed to fetch CTAs' }, { status: 500 });
    }
}

// POST /api/ctas - Create a new CTA
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Auto-generate name from domain
        const name = extractDomain(url);

        // Check if URL already exists
        const { data: existing } = await supabase
            .from('cta_urls')
            .select('id')
            .eq('url', url)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'This CTA URL already exists' }, { status: 400 });
        }

        const { data: cta, error } = await supabase
            .from('cta_urls')
            .insert({ url, name })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(cta, { status: 201 });
    } catch (e) {
        console.error('Error creating CTA:', e);
        return NextResponse.json({ error: 'Failed to create CTA' }, { status: 500 });
    }
}

// DELETE /api/ctas - Delete a CTA
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'CTA ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('cta_urls')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error deleting CTA:', e);
        return NextResponse.json({ error: 'Failed to delete CTA' }, { status: 500 });
    }
}

