'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CommentEditor from '@/components/admin/CommentEditor';
import { CommentData } from '@/components/FBComments';
import { cn } from '@/lib/utils';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
    Search,
    Settings,
    FileText,
    MessageSquare,
    ExternalLink,
    Pencil,
    Trash2,
    Plus,
    Save,
    Loader2,
    Check,
    ChevronsUpDown,
    Link2,
} from 'lucide-react';

interface ArticleConfig {
    pixelId: string;
    ctaUrl: string;
}

interface Article {
    id: string;
    slug: string;
    title: string;
    ctaText?: string;
    ctaTitle?: string;
    ctaDescription?: string;
    comments?: CommentData[];
    created_at?: string;
}

interface Config {
    defaultPixelId: string;
    defaultCtaUrl: string;
    articles: Record<string, ArticleConfig | string>;
}

interface Pixel {
    id: string;
    pixel_id: string;
    name: string;
    created_at: string;
}

interface CtaUrl {
    id: string;
    url: string;
    name: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<Config | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);
    const [savingArticle, setSavingArticle] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    
    // Pixels & CTAs state
    const [pixels, setPixels] = useState<Pixel[]>([]);
    const [ctas, setCtas] = useState<CtaUrl[]>([]);
    const [newPixelId, setNewPixelId] = useState('');
    const [newPixelName, setNewPixelName] = useState('');
    const [newCtaUrl, setNewCtaUrl] = useState('');
    const [addingPixel, setAddingPixel] = useState(false);
    const [addingCta, setAddingCta] = useState(false);
    const [pixelPopoverOpen, setPixelPopoverOpen] = useState(false);
    const [ctaPopoverOpen, setCtaPopoverOpen] = useState(false);
    const [showAddPixelForm, setShowAddPixelForm] = useState(false);
    const [showAddCtaForm, setShowAddCtaForm] = useState(false);
    
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        fetchConfig();
        fetchArticles();
        fetchPixels();
        fetchCtas();
    }, []);

    const checkAuth = async () => {
        try {
            setIsAuthenticated(true);
        } catch (e) {
            router.push('/admin/login');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const data = await res.json();
                if (data.default && !data.defaultPixelId) {
                    const migratedConfig: Config = {
                        defaultPixelId: data.default,
                        defaultCtaUrl: 'https://mynuora.com/products/feminine-balance-gummies-1',
                        articles: {}
                    };
                    Object.entries(data.articles || {}).forEach(([slug, val]) => {
                        if (typeof val === 'string') {
                            migratedConfig.articles[slug] = { pixelId: val, ctaUrl: '' };
                        } else {
                            migratedConfig.articles[slug] = val as ArticleConfig;
                        }
                    });
                    setConfig(migratedConfig);
                } else {
                    setConfig(data);
                }
            }
        } catch (e) {
            console.error('Failed to fetch config', e);
        }
    };

    const fetchArticles = async () => {
        try {
            const res = await fetch('/api/articles');
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (e) {
            console.error('Failed to fetch articles', e);
        }
    };

    const fetchPixels = async () => {
        try {
            const res = await fetch('/api/pixels');
            if (res.ok) {
                const data = await res.json();
                setPixels(data);
            }
        } catch (e) {
            console.error('Failed to fetch pixels', e);
        }
    };

    const fetchCtas = async () => {
        try {
            const res = await fetch('/api/ctas');
            if (res.ok) {
                const data = await res.json();
                setCtas(data);
            }
        } catch (e) {
            console.error('Failed to fetch CTAs', e);
        }
    };

    const handleAddPixel = async () => {
        if (!newPixelId.trim() || !newPixelName.trim()) {
            toast.error('Pixel ID and name are required');
            return;
        }
        setAddingPixel(true);
        try {
            const res = await fetch('/api/pixels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pixel_id: newPixelId, name: newPixelName }),
            });
            if (res.ok) {
                const pixel = await res.json();
                setPixels([pixel, ...pixels]);
                setNewPixelId('');
                setNewPixelName('');
                setShowAddPixelForm(false);
                toast.success('Pixel added');
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to add pixel');
            }
        } catch (e) {
            toast.error('Failed to add pixel');
        } finally {
            setAddingPixel(false);
        }
    };

    const handleAddCta = async () => {
        if (!newCtaUrl.trim()) {
            toast.error('CTA URL is required');
            return;
        }
        setAddingCta(true);
        try {
            const res = await fetch('/api/ctas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newCtaUrl }),
            });
            if (res.ok) {
                const cta = await res.json();
                setCtas([cta, ...ctas]);
                setNewCtaUrl('');
                setShowAddCtaForm(false);
                toast.success('CTA added');
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to add CTA');
            }
        } catch (e) {
            toast.error('Failed to add CTA');
        } finally {
            setAddingCta(false);
        }
    };

    const handleDeletePixel = async (id: string) => {
        try {
            const res = await fetch(`/api/pixels?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPixels(pixels.filter(p => p.id !== id));
                toast.success('Pixel deleted');
            } else {
                toast.error('Failed to delete pixel');
            }
        } catch (e) {
            toast.error('Failed to delete pixel');
        }
    };

    const handleDeleteCta = async (id: string) => {
        try {
            const res = await fetch(`/api/ctas?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCtas(ctas.filter(c => c.id !== id));
                toast.success('CTA deleted');
            } else {
                toast.error('Failed to delete CTA');
            }
        } catch (e) {
            toast.error('Failed to delete CTA');
        }
    };

    const handleSaveConfig = async () => {
        if (!config) return;
        setSavingConfig(true);
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                toast.success('Settings saved');
            } else {
                toast.error('Failed to save settings');
            }
        } catch (e) {
            toast.error('Failed to save settings');
        } finally {
            setSavingConfig(false);
        }
    };

    const handleSaveArticle = async () => {
        if (!selectedArticle) return;
        setSavingArticle(true);
        try {
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: selectedArticle.slug,
                    comments: selectedArticle.comments,
                    ctaText: selectedArticle.ctaText,
                    ctaTitle: selectedArticle.ctaTitle,
                    ctaDescription: selectedArticle.ctaDescription
                }),
            });

            if (res.ok) {
                toast.success('Article saved');
                setArticles(articles.map(a => 
                    a.slug === selectedArticle.slug ? selectedArticle : a
                ));
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Failed to save article');
            }
        } catch (e) {
            toast.error('Failed to save article');
        } finally {
            setSavingArticle(false);
        }
    };

    const handleDeleteArticle = async () => {
        if (!articleToDelete) return;
        setDeleting(true);
        
        try {
            const res = await fetch(`/api/articles?slug=${articleToDelete}`, { 
                method: 'DELETE' 
            });

            if (res.ok) {
                toast.success('Article deleted');
                setArticles(articles.filter(a => a.slug !== articleToDelete));
                if (selectedArticle?.slug === articleToDelete) {
                    setSelectedArticle(null);
                    setSheetOpen(false);
                }
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Failed to delete article');
            }
        } catch (e) {
            toast.error('Failed to delete article');
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setArticleToDelete(null);
        }
    };

    const updateArticleConfig = (slug: string, key: 'pixelId' | 'ctaUrl', value: string) => {
        if (!config) return;
        const currentArticleConfig = config.articles?.[slug];

        let baseConfig: ArticleConfig;
        if (typeof currentArticleConfig === 'string') {
            baseConfig = { pixelId: currentArticleConfig, ctaUrl: '' };
        } else {
            baseConfig = (currentArticleConfig as ArticleConfig) || { pixelId: '', ctaUrl: '' };
        }

        const newArticleConfig: ArticleConfig = { ...baseConfig, [key]: value };

        setConfig({
            ...config,
            articles: {
                ...config.articles,
                [slug]: newArticleConfig
            }
        });
    };

    const getArticleConfigValue = (slug: string, key: 'pixelId' | 'ctaUrl') => {
        const articleConfig = config?.articles?.[slug];
        if (!articleConfig) return '';
        if (typeof articleConfig === 'string') return key === 'pixelId' ? articleConfig : '';
        return articleConfig[key] || '';
    };

    // Helper to get pixel display text
    const getPixelDisplay = (pixelId: string) => {
        if (!pixelId) return 'Select pixel...';
        const pixel = pixels.find(p => p.pixel_id === pixelId);
        if (pixel) return `${pixel.pixel_id} (${pixel.name})`;
        return pixelId;
    };

    // Helper to get CTA display text
    const getCtaDisplay = (url: string) => {
        if (!url) return 'Select CTA URL...';
        const cta = ctas.find(c => c.url === url);
        if (cta) return `${cta.name} - ${url.slice(0, 40)}${url.length > 40 ? '...' : ''}`;
        return url.slice(0, 50) + (url.length > 50 ? '...' : '');
    };

    // Filter articles by search query
    const filteredArticles = useMemo(() => {
        if (!searchQuery.trim()) return articles;
        const query = searchQuery.toLowerCase();
        return articles.filter(a => 
            a.title.toLowerCase().includes(query) || 
            a.slug.toLowerCase().includes(query)
        );
    }, [articles, searchQuery]);

    const openArticlePanel = (article: Article) => {
        setSelectedArticle({ ...article });
        setSheetOpen(true);
    };

    const confirmDelete = (slug: string) => {
        setArticleToDelete(slug);
        setDeleteDialogOpen(true);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <Skeleton className="h-10 w-64" />
                <div className="border rounded-lg">
                    <div className="p-4 border-b">
                        <Skeleton className="h-4 w-full" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 border-b">
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                        <h1 className="text-2xl font-semibold text-zinc-900">Articles</h1>
                        <p className="text-sm text-zinc-500 mt-1">{articles.length} total articles</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Settings Button */}
                        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="border-zinc-200">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Global Settings</DialogTitle>
                                    <DialogDescription>
                                        Manage your Facebook Pixels and CTA URLs
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <Tabs defaultValue="pixels" className="mt-4">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="pixels">Pixels ({pixels.length})</TabsTrigger>
                                        <TabsTrigger value="ctas">CTAs ({ctas.length})</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="pixels" className="mt-4 space-y-4">
                                        {/* Add New Pixel Form */}
                                        {showAddPixelForm ? (
                                            <div className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-zinc-50">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-zinc-500">Pixel ID</Label>
                                                    <Input
                                                        placeholder="e.g. 1234567890123456"
                                                        value={newPixelId}
                                                        onChange={(e) => setNewPixelId(e.target.value)}
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-zinc-500">Name (for identification)</Label>
                                                    <Input
                                                        placeholder="e.g. Nuora, Client ABC"
                                                        value={newPixelName}
                                                        onChange={(e) => setNewPixelName(e.target.value)}
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        onClick={handleAddPixel} 
                                                        disabled={addingPixel}
                                                        size="sm"
                                                        className="bg-zinc-900 hover:bg-zinc-800"
                                                    >
                                                        {addingPixel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Pixel'}
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowAddPixelForm(false);
                                                            setNewPixelId('');
                                                            setNewPixelName('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                className="w-full border-dashed"
                                                onClick={() => setShowAddPixelForm(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add New Pixel
                                            </Button>
                                        )}
                                        
                                        {/* Pixels List */}
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {pixels.length === 0 ? (
                                                <p className="text-sm text-zinc-400 text-center py-4">No pixels added yet</p>
                                            ) : (
                                                pixels.map((pixel) => (
                                                    <div 
                                                        key={pixel.id} 
                                                        className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-zinc-900 truncate">
                                                                {pixel.pixel_id}
                                                            </p>
                                                            <p className="text-xs text-zinc-500">{pixel.name}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-400 hover:text-red-600"
                                                            onClick={() => handleDeletePixel(pixel.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="ctas" className="mt-4 space-y-4">
                                        {/* Add New CTA Form */}
                                        {showAddCtaForm ? (
                                            <div className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-zinc-50">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-zinc-500">CTA URL</Label>
                                                    <Input
                                                        placeholder="https://example.com/product"
                                                        value={newCtaUrl}
                                                        onChange={(e) => setNewCtaUrl(e.target.value)}
                                                        className="text-sm"
                                                    />
                                                    <p className="text-xs text-zinc-400">
                                                        Name will be auto-generated from domain
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        onClick={handleAddCta} 
                                                        disabled={addingCta}
                                                        size="sm"
                                                        className="bg-zinc-900 hover:bg-zinc-800"
                                                    >
                                                        {addingCta ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add CTA'}
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowAddCtaForm(false);
                                                            setNewCtaUrl('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                className="w-full border-dashed"
                                                onClick={() => setShowAddCtaForm(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add New CTA URL
                                            </Button>
                                        )}
                                        
                                        {/* CTAs List */}
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {ctas.length === 0 ? (
                                                <p className="text-sm text-zinc-400 text-center py-4">No CTAs added yet</p>
                                            ) : (
                                                ctas.map((cta) => (
                                                    <div 
                                                        key={cta.id} 
                                                        className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 transition-colors"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-zinc-900">
                                                                {cta.name}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 truncate">{cta.url}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-400 hover:text-red-600"
                                                            onClick={() => handleDeleteCta(cta.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                        
                        {/* Create Article Button */}
                        <Button asChild className="bg-zinc-900 hover:bg-zinc-800">
                            <Link href="/admin/create">
                                <Plus className="h-4 w-4 mr-2" />
                                New Article
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search by title or slug..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-zinc-200"
                    />
                    </div>

                {/* Table */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                    <Table className="table-fixed">
                        <TableHeader>
                            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                                <TableHead className="font-semibold text-zinc-700 w-[50%]">Title</TableHead>
                                <TableHead className="font-semibold text-zinc-700 w-[25%]">Slug</TableHead>
                                <TableHead className="font-semibold text-zinc-700 w-[10%] text-center">Comments</TableHead>
                                <TableHead className="font-semibold text-zinc-700 w-[15%] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredArticles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-zinc-400">
                                        {searchQuery ? 'No articles match your search' : 'No articles yet'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredArticles.map((article) => (
                                    <TableRow 
                                        key={article.slug}
                                        className="cursor-pointer hover:bg-zinc-50 transition-colors"
                                        onClick={() => openArticlePanel(article)}
                                    >
                                        <TableCell className="truncate">
                                            <span className="font-medium text-zinc-900">
                                                {article.title}
                                            </span>
                                        </TableCell>
                                        <TableCell className="truncate">
                                            <span className="text-zinc-500 text-sm font-mono truncate block">
                                                /{article.slug}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100">
                                                {article.comments?.length || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                                                    asChild
                                                >
                                                    <a href={`/articles/${article.slug}`} target="_blank">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                                                    asChild
                                                >
                                                    <Link href={`/admin/articles/${article.slug}`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-red-600"
                                                    onClick={() => confirmDelete(article.slug)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                        </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                            </div>
                        </div>

            {/* Article Config Slide Panel */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto px-6 sm:px-8">
                    {selectedArticle && (
                        <>
                            <SheetHeader className="mb-8">
                                <SheetTitle className="text-xl font-semibold line-clamp-2 pr-8">
                                    {selectedArticle.title}
                                </SheetTitle>
                                <SheetDescription className="font-mono text-xs text-zinc-400 truncate">
                                    /{selectedArticle.slug}
                                </SheetDescription>
                            </SheetHeader>

                                <div className="space-y-8">
                                {/* Quick Actions */}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild className="flex-1">
                                        <a href={`/articles/${selectedArticle.slug}`} target="_blank">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Live
                                        </a>
                                    </Button>
                                    <Button size="sm" asChild className="flex-1 bg-zinc-900 hover:bg-zinc-800">
                                        <Link href={`/admin/articles/${selectedArticle.slug}`}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Visual Editor
                                        </Link>
                                    </Button>
                                </div>

                                <Separator />

                                {/* Tracking Override with Comboboxes */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-zinc-500" />
                                        Tracking Override
                                    </h3>
                                    
                                    {/* Pixel Selector */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-zinc-500">Pixel ID</Label>
                                        <Popover open={pixelPopoverOpen} onOpenChange={setPixelPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={pixelPopoverOpen}
                                                    className="w-full justify-between font-normal text-left"
                                                >
                                                    <span className="truncate">
                                                        {getPixelDisplay(getArticleConfigValue(selectedArticle.slug, 'pixelId'))}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search pixels..." />
                                                    <CommandList>
                                                        <CommandEmpty>No pixel found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value=""
                                                                onSelect={() => {
                                                                    updateArticleConfig(selectedArticle.slug, 'pixelId', '');
                                                                    setPixelPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        !getArticleConfigValue(selectedArticle.slug, 'pixelId') ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                Use default
                                                            </CommandItem>
                                                            {pixels.map((pixel) => (
                                                                <CommandItem
                                                                    key={pixel.id}
                                                                    value={`${pixel.pixel_id} ${pixel.name}`}
                                                                    onSelect={() => {
                                                                        updateArticleConfig(selectedArticle.slug, 'pixelId', pixel.pixel_id);
                                                                        setPixelPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            getArticleConfigValue(selectedArticle.slug, 'pixelId') === pixel.pixel_id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <span className="font-mono text-sm">{pixel.pixel_id}</span>
                                                                    <span className="text-zinc-500 ml-2">({pixel.name})</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                onSelect={() => {
                                                                    setPixelPopoverOpen(false);
                                                                    setSettingsOpen(true);
                                                                }}
                                                                className="text-zinc-500"
                                                            >
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Add new pixel...
                                                            </CommandItem>
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    
                                    {/* CTA URL Selector */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-zinc-500">CTA URL</Label>
                                        <Popover open={ctaPopoverOpen} onOpenChange={setCtaPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={ctaPopoverOpen}
                                                    className="w-full justify-between font-normal text-left"
                                                >
                                                    <span className="truncate">
                                                        {getCtaDisplay(getArticleConfigValue(selectedArticle.slug, 'ctaUrl'))}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search CTAs..." />
                                                    <CommandList>
                                                        <CommandEmpty>No CTA found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value=""
                                                                onSelect={() => {
                                                                    updateArticleConfig(selectedArticle.slug, 'ctaUrl', '');
                                                                    setCtaPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        !getArticleConfigValue(selectedArticle.slug, 'ctaUrl') ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                Use default
                                                            </CommandItem>
                                                            {ctas.map((cta) => (
                                                                <CommandItem
                                                                    key={cta.id}
                                                                    value={`${cta.name} ${cta.url}`}
                                                                    onSelect={() => {
                                                                        updateArticleConfig(selectedArticle.slug, 'ctaUrl', cta.url);
                                                                        setCtaPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            getArticleConfigValue(selectedArticle.slug, 'ctaUrl') === cta.url ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{cta.name}</span>
                                                                        <span className="text-xs text-zinc-400 truncate max-w-[300px]">{cta.url}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                onSelect={() => {
                                                                    setCtaPopoverOpen(false);
                                                                    setSettingsOpen(true);
                                                                }}
                                                                className="text-zinc-500"
                                                            >
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Add new CTA...
                                                            </CommandItem>
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSaveConfig}
                                        disabled={savingConfig}
                                        className="w-full"
                                    >
                                        {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Tracking Config'}
                                    </Button>
                                </div>

                                <Separator />

                                {/* CTA Content */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-zinc-500" />
                                        CTA Content
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-zinc-500">Title</Label>
                                            <Input
                                                placeholder="e.g. Curious about the science?"
                                                value={selectedArticle.ctaTitle || ''}
                                                onChange={(e) => setSelectedArticle({ ...selectedArticle, ctaTitle: e.target.value })}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-zinc-500">Button Text</Label>
                                            <Input
                                                placeholder="e.g. Check Availability »"
                                                value={selectedArticle.ctaText || ''}
                                                onChange={(e) => setSelectedArticle({ ...selectedArticle, ctaText: e.target.value })}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label className="text-xs text-zinc-500">Subtext</Label>
                                            <Input
                                                placeholder="e.g. Secure, verified link..."
                                                value={selectedArticle.ctaDescription || ''}
                                                onChange={(e) => setSelectedArticle({ ...selectedArticle, ctaDescription: e.target.value })}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Comments Manager */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-zinc-500" />
                                        Comments ({selectedArticle.comments?.length || 0})
                                        </h3>
                                        <CommentEditor
                                        comments={selectedArticle.comments || []}
                                        onChange={(newComments) => setSelectedArticle({ ...selectedArticle, comments: newComments })}
                                        />
                                    </div>

                                <Separator />

                                {/* Save Button */}
                                <Button
                                    onClick={handleSaveArticle}
                                    disabled={savingArticle}
                                    className="w-full bg-zinc-900 hover:bg-zinc-800"
                                >
                                    {savingArticle ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Article
                                        </>
                                    )}
                                </Button>

                                {/* Danger Zone */}
                                <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                                    <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                                        Danger Zone
                                    </h4>
                                    <p className="text-xs text-zinc-500 mb-3">
                                        Permanently delete this article. This cannot be undone.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => confirmDelete(selectedArticle.slug)}
                                        className="border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Article
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Article</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong className="text-zinc-900">/{articleToDelete}</strong>? 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteArticle}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
