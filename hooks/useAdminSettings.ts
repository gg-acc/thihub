import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Pixel {
    id: string;
    name: string;
    pixel_id: string;
}

export interface CtaUrl {
    id: string;
    name: string;
    url: string;
}

export function useAdminSettings() {
    const [pixels, setPixels] = useState<Pixel[]>([]);
    const [ctaUrls, setCtaUrls] = useState<CtaUrl[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const [pixelsRes, ctaUrlsRes] = await Promise.all([
                fetch('/api/pixels'),
                fetch('/api/cta-urls')
            ]);

            if (pixelsRes.ok) {
                setPixels(await pixelsRes.json());
            }
            if (ctaUrlsRes.ok) {
                setCtaUrls(await ctaUrlsRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const addPixel = async (name: string, pixelId: string) => {
        try {
            const res = await fetch('/api/pixels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, pixelId }),
            });
            if (!res.ok) throw new Error('Failed to create pixel');
            const newPixel = await res.json();
            setPixels(prev => [newPixel, ...prev]);
            toast.success('Pixel added');
            return newPixel;
        } catch (error) {
            toast.error('Failed to add pixel');
            throw error;
        }
    };

    const updatePixel = async (id: string, name: string, pixelId: string) => {
        try {
            const res = await fetch('/api/pixels', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, pixelId }),
            });
            if (!res.ok) throw new Error('Failed to update pixel');
            const updatedPixel = await res.json();
            setPixels(prev => prev.map(p => p.id === id ? updatedPixel : p));
            toast.success('Pixel updated');
        } catch (error) {
            toast.error('Failed to update pixel');
            throw error;
        }
    };

    const deletePixel = async (id: string) => {
        try {
            const res = await fetch(`/api/pixels?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete pixel');
            setPixels(prev => prev.filter(p => p.id !== id));
            toast.success('Pixel deleted');
        } catch (error) {
            toast.error('Failed to delete pixel');
            throw error;
        }
    };

    const addCtaUrl = async (name: string, url: string) => {
        try {
            const res = await fetch('/api/cta-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, url }),
            });
            if (!res.ok) throw new Error('Failed to create CTA URL');
            const newUrl = await res.json();
            setCtaUrls(prev => [newUrl, ...prev]);
            toast.success('CTA URL added');
            return newUrl;
        } catch (error) {
            toast.error('Failed to add CTA URL');
            throw error;
        }
    };

    const updateCtaUrl = async (id: string, name: string, url: string) => {
        try {
            const res = await fetch('/api/cta-urls', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, url }),
            });
            if (!res.ok) throw new Error('Failed to update CTA URL');
            const updatedUrl = await res.json();
            setCtaUrls(prev => prev.map(u => u.id === id ? updatedUrl : u));
            toast.success('CTA URL updated');
        } catch (error) {
            toast.error('Failed to update CTA URL');
            throw error;
        }
    };

    const deleteCtaUrl = async (id: string) => {
        try {
            const res = await fetch(`/api/cta-urls?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete CTA URL');
            setCtaUrls(prev => prev.filter(u => u.id !== id));
            toast.success('CTA URL deleted');
        } catch (error) {
            toast.error('Failed to delete CTA URL');
            throw error;
        }
    };

    return {
        pixels,
        ctaUrls,
        isLoading,
        addPixel,
        updatePixel,
        deletePixel,
        addCtaUrl,
        updateCtaUrl,
        deleteCtaUrl,
        refresh: fetchSettings
    };
}

