'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface FacebookPixelProps {
    pixelId: string;
}

export default function FacebookPixel({ pixelId }: FacebookPixelProps) {
    const pathname = usePathname();

    useEffect(() => {
        if (!pixelId) return;

        // Initialize Facebook Pixel
        import('react-facebook-pixel')
            .then((x) => x.default)
            .then((ReactPixel) => {
                ReactPixel.init(pixelId);
                ReactPixel.pageView();
            });
    }, [pixelId, pathname]);

    return null;
}
