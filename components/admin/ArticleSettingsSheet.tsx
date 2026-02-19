import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, BarChart3, Globe, Plus, Settings } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import GlobalSettingsSheet from '@/components/admin/GlobalSettingsSheet';
import type { Domain } from '@/components/admin/GlobalSettingsSheet';
import { cn } from '@/lib/utils';

interface Article {
    slug: string;
    title: string;
    subtitle: string;
    content: string;
    author: string;
    reviewer: string;
    date: string;
    image: string;
    ctaText?: string;
    ctaTitle?: string;
    ctaDescription?: string;
    ctaUrl?: string;
    pixelId?: string;
    keyTakeaways?: { title: string; content: string }[] | null;
    comments?: any[];
    stickyCTAEnabled?: boolean;
    stickyCTAText?: string;
    stickyCTAPrice?: string;
    stickyCTAOriginalPrice?: string;
    stickyCTAProductName?: string;
    articleTheme?: 'v1' | 'v2';
    domainId?: string;
}

interface ArticleSettingsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    article: Article;
    setArticle: React.Dispatch<React.SetStateAction<Article>>;
}

export default function ArticleSettingsSheet({ open, onOpenChange, article, setArticle }: ArticleSettingsSheetProps) {
    const { pixels, ctaUrls, isLoading } = useAdminSettings();
    const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
    const [domains, setDomains] = useState<Domain[]>([]);

    const fetchDomains = useCallback(async () => {
        try {
            const res = await fetch('/api/domains');
            if (res.ok) setDomains(await res.json());
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchDomains(); }, [fetchDomains]);

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-[400px] sm:w-[600px] sm:max-w-[600px] overflow-y-auto backdrop-blur-sm bg-white/95">
                    <SheetHeader>
                        <SheetTitle>Article Settings</SheetTitle>
                        <SheetDescription>
                            Configure tracking, CTA, and page settings.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-8">
                        {/* Domain / Branding */}
                        {domains.length > 0 && (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-purple-500" />
                                        Domain & Branding
                                    </h3>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground">Publish to Domain</Label>
                                        <Select
                                            value={article.domainId || "none"}
                                            onValueChange={(val) => setArticle(prev => ({ ...prev, domainId: val === "none" ? undefined : val }))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a domain..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Auto-detect from URL</SelectItem>
                                                {domains.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-sm text-white text-[8px] flex items-center justify-center font-bold" style={{ backgroundColor: d.logo_color }}>
                                                                {d.logo_letter}
                                                            </div>
                                                            {d.brand_name} — {d.domain}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">The article will use this domain&apos;s branding (logo, name, colors).</p>
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Tracking Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    Tracking & Destination
                                </h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => setIsGlobalSettingsOpen(true)}
                                >
                                    <Settings className="w-3 h-3 mr-1" />
                                    Manage Global Config
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Pixel ID</Label>
                                    <div className="flex gap-2">
                                        <Select 
                                            value={article.pixelId || "default"} 
                                            onValueChange={(val) => setArticle(prev => ({ ...prev, pixelId: val === "default" ? "" : val }))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a pixel..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Use Default</SelectItem>
                                                {pixels.map(pixel => (
                                                    <SelectItem key={pixel.id} value={pixel.pixel_id}>
                                                        {pixel.name} ({pixel.pixel_id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button size="icon" variant="outline" onClick={() => setIsGlobalSettingsOpen(true)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">CTA URL</Label>
                                    <div className="flex gap-2">
                                        <Select 
                                            value={ctaUrls.find(u => u.url === article.ctaUrl)?.id || (article.ctaUrl ? "custom" : "default")} 
                                            onValueChange={(val) => {
                                                if (val === "default") {
                                                    setArticle(prev => ({ ...prev, ctaUrl: "" }));
                                                } else if (val === "custom") {
                                                    // Do nothing, let input handle it
                                                } else {
                                                    const selected = ctaUrls.find(u => u.id === val);
                                                    if (selected) {
                                                        setArticle(prev => ({ ...prev, ctaUrl: selected.url }));
                                                    }
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a URL..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Use Default</SelectItem>
                                                {article.ctaUrl && !ctaUrls.find(u => u.url === article.ctaUrl) && (
                                                    <SelectItem value="custom">Custom URL</SelectItem>
                                                )}
                                                {ctaUrls.map(url => (
                                                    <SelectItem key={url.id} value={url.id}>
                                                        {url.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button size="icon" variant="outline" onClick={() => setIsGlobalSettingsOpen(true)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {/* Fallback input for custom URL or viewing the raw value */}
                                    <Input 
                                        value={article.ctaUrl || ''} 
                                        onChange={(e) => setArticle(prev => ({ ...prev, ctaUrl: e.target.value }))}
                                        placeholder="https://..."
                                        className="mt-2 font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Sticky CTA Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Sticky CTA Bar
                            </h3>
                            
                            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="sticky-enabled" className="cursor-pointer">Enable Sticky CTA</Label>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            id="sticky-enabled"
                                            type="checkbox"
                                            checked={article.stickyCTAEnabled || false}
                                            onChange={(e) => setArticle(prev => ({ ...prev, stickyCTAEnabled: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </div>
                                </div>

                                {article.stickyCTAEnabled && (
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="col-span-2 space-y-1">
                                            <Label className="text-xs">Product Name</Label>
                                            <Input
                                                value={article.stickyCTAProductName || ''}
                                                onChange={(e) => setArticle(prev => ({ ...prev, stickyCTAProductName: e.target.value }))}
                                                placeholder="e.g., Gut Health Formula"
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Button Text</Label>
                                            <Input
                                                value={article.stickyCTAText || 'Try Risk-Free'}
                                                onChange={(e) => setArticle(prev => ({ ...prev, stickyCTAText: e.target.value }))}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Price</Label>
                                            <Input
                                                value={article.stickyCTAPrice || ''}
                                                onChange={(e) => setArticle(prev => ({ ...prev, stickyCTAPrice: e.target.value }))}
                                                placeholder="$49.99"
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Original Price</Label>
                                            <Input
                                                value={article.stickyCTAOriginalPrice || ''}
                                                onChange={(e) => setArticle(prev => ({ ...prev, stickyCTAOriginalPrice: e.target.value }))}
                                                placeholder="$79.99"
                                                className="h-8"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* General Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-500" />
                                General Information
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Slug</Label>
                                    <Input
                                        value={article.slug}
                                        disabled
                                        className="h-8 bg-muted font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Date</Label>
                                    <Input
                                        value={article.date}
                                        onChange={(e) => setArticle(prev => ({ ...prev, date: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Author</Label>
                                    <Input
                                        value={article.author}
                                        onChange={(e) => setArticle(prev => ({ ...prev, author: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Reviewer</Label>
                                    <Input
                                        value={article.reviewer}
                                        onChange={(e) => setArticle(prev => ({ ...prev, reviewer: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <GlobalSettingsSheet 
                open={isGlobalSettingsOpen} 
                onOpenChange={setIsGlobalSettingsOpen} 
            />
        </>
    );
}

