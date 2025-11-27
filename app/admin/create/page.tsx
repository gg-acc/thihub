'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GenerationOverlay from '@/components/admin/GenerationOverlay';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Sparkles, Plus, X, AlertCircle } from 'lucide-react';

export default function CreateArticlePage() {
    const router = useRouter();
    const [rawText, setRawText] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState(0);
    const [error, setError] = useState('');

    // Pixel State
    const [pixels, setPixels] = useState<string[]>([]);
    const [selectedPixel, setSelectedPixel] = useState('');
    const [newPixel, setNewPixel] = useState('');
    const [isAddingPixel, setIsAddingPixel] = useState(false);

    // CTA State
    const [ctas, setCtas] = useState<string[]>([]);
    const [selectedCta, setSelectedCta] = useState('');
    const [newCta, setNewCta] = useState('');
    const [isAddingCta, setIsAddingCta] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [articlesRes, configRes] = await Promise.all([
                    fetch('/api/articles'),
                    fetch('/api/config')
                ]);

                const articles = await articlesRes.json();
                const config = await configRes.json();

                // Extract unique Pixels
                const articlePixels = articles.map((a: any) => a.pixelId).filter(Boolean);
                const allPixels = Array.from(new Set([config.defaultPixelId, ...articlePixels])).filter(Boolean);
                setPixels(allPixels as string[]);
                if (allPixels.length > 0) setSelectedPixel(allPixels[0] as string);

                // Extract unique CTAs
                const articleCtas = articles.map((a: any) => a.ctaUrl).filter(Boolean);
                const allCtas = Array.from(new Set([config.defaultCtaUrl, ...articleCtas])).filter(Boolean);
                setCtas(allCtas as string[]);
                if (allCtas.length > 0) setSelectedCta(allCtas[0] as string);

            } catch (err) {
                console.error('Failed to load data', err);
            }
        };
        fetchData();
    }, []);

    const handleGenerate = async () => {
        if (!rawText) {
            setError('Please enter the article text.');
            return;
        }

        const finalPixel = isAddingPixel ? newPixel : selectedPixel;
        const finalCta = isAddingCta ? newCta : selectedCta;

        if (!finalPixel) {
            setError('Please select or add a Pixel ID.');
            return;
        }
        if (!finalCta) {
            setError('Please select or add a CTA URL.');
            return;
        }

        setLoading(true);
        setStage(0);
        setError('');

        // Simulate stage progression for better UX
        const stageInterval = setInterval(() => {
            setStage(prev => (prev < 3 ? prev + 1 : prev));
        }, 2500);

        try {
            const res = await fetch('/api/generate-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawText,
                    slug,
                    pixelId: finalPixel,
                    ctaUrl: finalCta
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate article');
            }

            clearInterval(stageInterval);
            setStage(3); // Final stage

            // Wait for final animation
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect to editor
            router.push(`/admin/articles/${data.slug}`);

        } catch (err: any) {
            clearInterval(stageInterval);
            setError(err.message);
            setLoading(false);
        }
    };

    // Show cinematic overlay when loading
    if (loading) {
        return <GenerationOverlay stage={stage} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="text-zinc-600 hover:text-zinc-900">
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Dashboard
                    </Link>
                </Button>
                <div className="h-6 w-px bg-zinc-200" />
                <h1 className="text-2xl font-semibold text-zinc-900">Create New Article</h1>
            </div>

            {/* Main Form Card */}
            <Card className="border-zinc-200 max-w-3xl">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-zinc-500" />
                        AI Article Generator
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Paste your raw text and let AI transform it into a beautifully formatted article
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Custom Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="slug" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Custom Slug (Optional)
                        </Label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-zinc-500 bg-zinc-100 border border-r-0 border-zinc-200 rounded-l-md">
                                /articles/
                            </span>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                placeholder="e.g. my-article-slug"
                                className="rounded-l-none border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400"
                            />
                        </div>
                        <p className="text-xs text-zinc-400">
                            Leave blank to auto-generate from the title
                        </p>
                    </div>

                    {/* Advertorial Text */}
                    <div className="space-y-2">
                        <Label htmlFor="rawText" className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Advertorial Text
                        </Label>
                        <p className="text-xs text-zinc-400 mb-2">
                            Paste the raw text here. AI will format it, generate a title, and create realistic comments.
                        </p>
                        <Textarea
                            id="rawText"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Paste your article text here..."
                            className="min-h-[250px] border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400 resize-none"
                        />
                    </div>

                    {/* Pixel & CTA Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Facebook Pixel ID */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Facebook Pixel ID
                            </Label>
                            {!isAddingPixel ? (
                                <div className="flex gap-2">
                                    <Select value={selectedPixel} onValueChange={setSelectedPixel}>
                                        <SelectTrigger className="flex-1 border-zinc-200 focus:ring-zinc-400">
                                            <SelectValue placeholder="Select a Pixel ID" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pixels.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsAddingPixel(true)}
                                        className="border-zinc-200 hover:bg-zinc-100"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={newPixel}
                                        onChange={(e) => setNewPixel(e.target.value)}
                                        placeholder="Enter Pixel ID"
                                        className="flex-1 border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400"
                                        autoFocus
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setIsAddingPixel(false);
                                            setNewPixel('');
                                        }}
                                        className="text-zinc-500 hover:text-zinc-900"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* CTA URL */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                CTA URL
                            </Label>
                            {!isAddingCta ? (
                                <div className="flex gap-2">
                                    <Select value={selectedCta} onValueChange={setSelectedCta}>
                                        <SelectTrigger className="flex-1 border-zinc-200 focus:ring-zinc-400">
                                            <SelectValue placeholder="Select a CTA URL" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ctas.map(c => (
                                                <SelectItem key={c} value={c}>
                                                    <span className="truncate max-w-[200px]">{c}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsAddingCta(true)}
                                        className="border-zinc-200 hover:bg-zinc-100"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={newCta}
                                        onChange={(e) => setNewCta(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400"
                                        autoFocus
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setIsAddingCta(false);
                                            setNewCta('');
                                        }}
                                        className="text-zinc-500 hover:text-zinc-900"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        size="lg"
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold h-14 text-base"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Article with AI
                    </Button>

                    <p className="text-center text-xs text-zinc-400">
                        Powered by Google Gemini Flash. Generates title, content, and comments automatically.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
