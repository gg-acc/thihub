'use client';

import usePreserveParams from '@/hooks/usePreserveParams';

interface UrlPreserverProps {
    articleSlug?: string;
}

export default function UrlPreserver({ articleSlug }: UrlPreserverProps) {
    usePreserveParams(articleSlug);
    return null;
}
