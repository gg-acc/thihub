'use client';

import FacebookPixel from './FacebookPixel';
import usePixelEvents from '@/hooks/usePixelEvents';

interface PixelTrackerProps {
    pixelId: string;
}

export default function PixelTracker({ pixelId }: PixelTrackerProps) {
    // Initialize events hook
    usePixelEvents();

    return <FacebookPixel pixelId={pixelId} />;
}
