import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

export interface BrandConfig {
    brandName: string;
    brandTagline: string;
    logoLetter: string;
    logoColor: string;
    domain: string;
}

const DEFAULT_BRAND: BrandConfig = {
    brandName: 'The Insider',
    brandTagline: 'Stories That Matter',
    logoLetter: 'T',
    logoColor: '#0F4C81',
    domain: '',
};

export async function getBranding(): Promise<BrandConfig> {
    try {
        const headersList = await headers();
        const host = headersList.get('host') || '';
        const domain = host.replace(/^www\./, '').split(':')[0]; // strip www and port

        const supabase = await createClient();
        const { data } = await supabase
            .from('domains')
            .select('*')
            .eq('domain', domain)
            .single();

        if (data) {
            return {
                brandName: data.brand_name,
                brandTagline: data.brand_tagline,
                logoLetter: data.logo_letter,
                logoColor: data.logo_color,
                domain: data.domain,
            };
        }
    } catch {
        // Fall through to default
    }
    return DEFAULT_BRAND;
}

// For fetching branding by domain_id (used when article has a specific domain)
export async function getBrandingById(domainId: string): Promise<BrandConfig> {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('domains')
            .select('*')
            .eq('id', domainId)
            .single();

        if (data) {
            return {
                brandName: data.brand_name,
                brandTagline: data.brand_tagline,
                logoLetter: data.logo_letter,
                logoColor: data.logo_color,
                domain: data.domain,
            };
        }
    } catch {
        // Fall through to default
    }
    return DEFAULT_BRAND;
}
