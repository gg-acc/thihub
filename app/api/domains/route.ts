import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Auto-generate brand identity from domain name
function generateBrandFromDomain(domain: string) {
    // Strip TLD and www
    const name = domain
        .replace(/^www\./, '')
        .replace(/\.(com|net|org|co|io|app|dev|ch|de|uk|us|ca|au)$/i, '');

    // Convert to title case brand name (split on hyphens, dots, camelCase)
    const brandName = name
        .replace(/[-_.]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

    // Generate a consistent color from the domain string
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const logoColor = `hsl(${hue}, 55%, 35%)`;

    const logoLetter = brandName.charAt(0).toUpperCase();

    const taglines = [
        'Your Trusted Source',
        'Stories That Matter',
        'The Inside Scoop',
        'Real Stories, Real Results',
        'Discover What Works',
    ];
    const tagline = taglines[Math.abs(hash) % taglines.length];

    return { brandName, logoLetter, logoColor, brandTagline: tagline };
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: domains, error } = await supabase
            .from('domains')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(domains);
    } catch (error) {
        console.error('Error fetching domains:', error);
        return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const domain = body.domain?.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // Auto-generate brand identity
        const generated = generateBrandFromDomain(domain);

        const { data, error } = await supabase
            .from('domains')
            .insert([{
                domain,
                brand_name: body.brandName || generated.brandName,
                brand_tagline: body.brandTagline || generated.brandTagline,
                logo_letter: body.logoLetter || generated.logoLetter,
                logo_color: body.logoColor || generated.logoColor,
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating domain:', error);
        return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const { data, error } = await supabase
            .from('domains')
            .update({
                brand_name: body.brandName,
                brand_tagline: body.brandTagline,
                logo_letter: body.logoLetter,
                logo_color: body.logoColor,
                updated_at: new Date().toISOString(),
            })
            .eq('id', body.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating domain:', error);
        return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('domains')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting domain:', error);
        return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
    }
}
