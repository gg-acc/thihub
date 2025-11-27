import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export interface Pixel {
    id: string;
    pixel_id: string;
    name: string;
    created_at: string;
}

// GET /api/pixels - Get all pixels
export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data: pixels, error } = await supabase
            .from('pixels')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(pixels || []);
    } catch (e) {
        console.error('Error fetching pixels:', e);
        return NextResponse.json({ error: 'Failed to fetch pixels' }, { status: 500 });
    }
}

// POST /api/pixels - Create a new pixel
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { pixel_id, name } = body;

        if (!pixel_id || !name) {
            return NextResponse.json({ error: 'Pixel ID and name are required' }, { status: 400 });
        }

        // Check if pixel_id already exists
        const { data: existing } = await supabase
            .from('pixels')
            .select('id')
            .eq('pixel_id', pixel_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'This Pixel ID already exists' }, { status: 400 });
        }

        const { data: pixel, error } = await supabase
            .from('pixels')
            .insert({ pixel_id, name })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(pixel, { status: 201 });
    } catch (e) {
        console.error('Error creating pixel:', e);
        return NextResponse.json({ error: 'Failed to create pixel' }, { status: 500 });
    }
}

// DELETE /api/pixels - Delete a pixel
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
            return NextResponse.json({ error: 'Pixel ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('pixels')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error deleting pixel:', e);
        return NextResponse.json({ error: 'Failed to delete pixel' }, { status: 500 });
    }
}

