'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import GenerationOverlay from '@/components/admin/GenerationOverlay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Sparkles, Plus, X, FileText, FlaskConical, Globe, Wand2, PenTool, BookOpen, Newspaper, User, Megaphone } from 'lucide-react';

type CreationMode = 'manual' | 'ai-write';

export default function CreateArticlePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generationStage, setGenerationStage] = useState(0);
    const stageTimersRef = useRef<NodeJS.Timeout[]>([]);

    // Creation Mode
    const [creationMode, setCreationMode] = useState<CreationMode>('ai-write');

    // Manual mode state
    const [rawText, setRawText] = useState('');
    const [articleTheme, setArticleTheme] = useState<'v1' | 'v2'>('v1');

    // AI Write mode state
    const [topic, setTopic] = useState('');
    const [brief, setBrief] = useState('');
    const [narrativeStyle, setNarrativeStyle] = useState<'first-person' | 'journalism'>('first-person');
    const [framework, setFramework] = useState<'classic-dr' | 'modern-native'>('modern-native');

    // Shared state
    const [slug, setSlug] = useState('');
    const [pixels, setPixels] = useState<string[]>([]);
    const [selectedPixel, setSelectedPixel] = useState('');
    const [newPixel, setNewPixel] = useState('');
    const [isAddingPixel, setIsAddingPixel] = useState(false);
    const [ctas, setCtas] = useState<string[]>([]);
    const [selectedCta, setSelectedCta] = useState('');
    const [newCta, setNewCta] = useState('');
    const [isAddingCta, setIsAddingCta] = useState(false);
    const [domains, setDomains] = useState<{ id: string; domain: string; brand_name: string; logo_letter: string; logo_color: string }[]>([]);
    const [selectedDomainId, setSelectedDomainId] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [articlesRes, configRes, domainsRes] = await Promise.all([
                    fetch('/api/articles'),
                    fetch('/api/config'),
                    fetch('/api/domains')
                ]);

                if (domainsRes.ok) {
                    const domainsData = await domainsRes.json();
                    setDomains(domainsData);
                }

                const articles = await articlesRes.json();
                const config = await configRes.json();

                const articlePixels = articles.map((a: any) => a.pixelId).filter(Boolean);
                const allPixels = Array.from(new Set([config.defaultPixelId, ...articlePixels])).filter(Boolean);
                setPixels(allPixels as string[]);
                if (allPixels.length > 0) setSelectedPixel(allPixels[0] as string);

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

    const startStageTimers = (durations: number[]) => {
        stageTimersRef.current.forEach(timer => clearTimeout(timer));
        stageTimersRef.current = [];
        durations.forEach((_, index) => {
            const timer = setTimeout(() => {
                setGenerationStage(index + 1);
            }, durations.slice(0, index + 1).reduce((a, b) => a + b, 0));
            stageTimersRef.current.push(timer);
        });
    };

    const clearTimers = () => {
        stageTimersRef.current.forEach(timer => clearTimeout(timer));
        stageTimersRef.current = [];
    };

    const handleGenerate = async () => {
        const finalPixel = isAddingPixel ? newPixel : selectedPixel;
        const finalCta = isAddingCta ? newCta : selectedCta;

        if (!finalCta) {
            toast.error('Please select or add a CTA URL');
            return;
        }

        if (creationMode === 'manual' && !rawText) {
            toast.error('Please enter the article text');
            return;
        }

        if (creationMode === 'ai-write' && !topic) {
            toast.error('Please enter a topic/angle');
            return;
        }

        setLoading(true);
        setGenerationStage(0);

        const safeJson = async (r: Response) => {
            const text = await r.text();
            try { return JSON.parse(text); }
            catch { throw new Error('Server timed out or crashed. Please try again.'); }
        };

        if (creationMode === 'ai-write') {
            // AI Write: single call does everything (scrape → write → images → save)
            startStageTimers([5000, 30000, 60000, 30000]);
        } else {
            startStageTimers([5000, 10000, 25000]);
        }

        try {
            let res: Response;

            if (creationMode === 'ai-write') {
                // Single API call — everything happens server-side
                setGenerationStage(0);
                res = await fetch('/api/generate-advertorial', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic,
                        ctaUrl: finalCta,
                        brief: brief || undefined,
                        narrativeStyle,
                        framework,
                        pixelId: finalPixel,
                        slug,
                        domainId: selectedDomainId || undefined,
                    }),
                });

                const data = await safeJson(res);
                if (!res.ok) throw new Error(data.error || 'Failed to generate advertorial');

                if (data.imagesGenerated) {
                    toast.success(`Article created with ${data.imagesGenerated} AI images!`);
                } else {
                    toast.success('Article generated successfully!');
                }
                router.push(`/admin/articles/${data.slug}`);

            } else {
                // Manual mode: single request
                res = await fetch('/api/generate-article', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rawText,
                        slug,
                        pixelId: finalPixel,
                        ctaUrl: finalCta,
                        theme: articleTheme,
                        domainId: selectedDomainId || undefined,
                    })
                });

                const data = await safeJson(res);
                if (!res.ok) throw new Error(data.error || 'Failed to generate article');

                toast.success('Article generated successfully!');
                router.push(`/admin/articles/${data.slug}`);
            }

        } catch (err: any) {
            clearTimers();
            if (err.message && (err.message.includes('PGRST204') || err.message.includes('article_theme'))) {
                toast.error(
                    <div className="flex flex-col gap-2">
                        <span>Database migration required for V2 features.</span>
                        <a href="/api/setup-v2-schema" target="_blank" className="underline font-bold text-white hover:text-gray-200">
                            Click here to update database
                        </a>
                    </div>,
                    { duration: 10000 }
                );
            } else {
                toast.error(err.message || 'Failed to generate article');
            }
            setLoading(false);
            setGenerationStage(0);
        }
    };

    const handleAddPixel = () => {
        if (newPixel.trim()) {
            setPixels([...pixels, newPixel.trim()]);
            setSelectedPixel(newPixel.trim());
            setNewPixel('');
            setIsAddingPixel(false);
        }
    };

    const handleAddCta = () => {
        if (newCta.trim()) {
            setCtas([...ctas, newCta.trim()]);
            setSelectedCta(newCta.trim());
            setNewCta('');
            setIsAddingCta(false);
        }
    };

    return (
        <>
            {loading && <GenerationOverlay stage={generationStage} mode={creationMode} />}

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Article</h1>
                        <p className="text-muted-foreground">Generate a new article with AI</p>
                    </div>
                </div>

                {/* Creation Mode Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Creation Mode</CardTitle>
                        <CardDescription>
                            Choose how you want to create your article
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setCreationMode('ai-write')}
                                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                    creationMode === 'ai-write'
                                        ? 'border-purple-500 bg-purple-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                    creationMode === 'ai-write' ? 'bg-purple-100' : 'bg-gray-100'
                                }`}>
                                    <Wand2 className={`w-5 h-5 ${creationMode === 'ai-write' ? 'text-purple-600' : 'text-gray-500'}`} />
                                </div>
                                <h3 className="font-semibold text-gray-900">AI Write</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Give a topic & CTA link — AI writes the full advertorial
                                </p>
                                {creationMode === 'ai-write' && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                <div className="mt-2 flex flex-wrap gap-1">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">Claude Opus</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">Auto Images</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setCreationMode('manual')}
                                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                    creationMode === 'manual'
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                    creationMode === 'manual' ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                    <PenTool className={`w-5 h-5 ${creationMode === 'manual' ? 'text-blue-600' : 'text-gray-500'}`} />
                                </div>
                                <h3 className="font-semibold text-gray-900">Manual Text</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Paste your own text — AI formats & adds images
                                </p>
                                {creationMode === 'manual' && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                <div className="mt-2 flex flex-wrap gap-1">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Gemini</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Auto Images</span>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── AI WRITE MODE ─── */}
                {creationMode === 'ai-write' && (
                    <>
                        {/* Topic & Brief */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wand2 className="h-5 w-5 text-purple-500" />
                                    Advertorial Brief
                                </CardTitle>
                                <CardDescription>
                                    Provide the topic and optionally a detailed brief. Claude Opus 4.6 will write the full article.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Topic / Angle <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Weighted blankets for anxiety relief in busy moms"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The main angle for the advertorial. Be specific for better results.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Detailed Brief <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                    <Textarea
                                        value={brief}
                                        onChange={(e) => setBrief(e.target.value)}
                                        className="min-h-[120px] resize-y"
                                        placeholder="Optional: Provide specific instructions, key claims, target audience details, pain points to address, tone preferences, etc. If left blank, the AI will autonomously craft the article based on the topic and product page."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Custom Slug <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                            /articles/
                                        </span>
                                        <Input
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                            className="rounded-l-none"
                                            placeholder="my-article-slug"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Style & Framework */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Writing Style</CardTitle>
                                <CardDescription>
                                    Choose the narrative approach and copywriting framework
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Narrative Style */}
                                <div className="space-y-3">
                                    <Label>Narrative Style</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setNarrativeStyle('first-person')}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                narrativeStyle === 'first-person'
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className={`w-4 h-4 ${narrativeStyle === 'first-person' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <span className="font-medium text-sm">First-Person Story</span>
                                            </div>
                                            <p className="text-xs text-gray-500">"I was struggling with X until I discovered..."</p>
                                        </button>
                                        <button
                                            onClick={() => setNarrativeStyle('journalism')}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                narrativeStyle === 'journalism'
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Newspaper className={`w-4 h-4 ${narrativeStyle === 'journalism' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <span className="font-medium text-sm">Investigative Journalism</span>
                                            </div>
                                            <p className="text-xs text-gray-500">"Our reporters investigated the new trend..."</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Copywriting Framework */}
                                <div className="space-y-3">
                                    <Label>Copywriting Framework</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setFramework('classic-dr')}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                framework === 'classic-dr'
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <BookOpen className={`w-4 h-4 ${framework === 'classic-dr' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <span className="font-medium text-sm">Classic Direct Response</span>
                                            </div>
                                            <p className="text-xs text-gray-500">Schwartz, Halbert, Ogilvy — proven sales copy</p>
                                        </button>
                                        <button
                                            onClick={() => setFramework('modern-native')}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                                                framework === 'modern-native'
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Megaphone className={`w-4 h-4 ${framework === 'modern-native' ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <span className="font-medium text-sm">Modern Native Ad</span>
                                            </div>
                                            <p className="text-xs text-gray-500">Brunson, Georgi — native ad prelander style</p>
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* ─── MANUAL MODE ─── */}
                {creationMode === 'manual' && (
                    <>
                        {/* Theme Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Article Theme</CardTitle>
                                <CardDescription>
                                    Choose the style and components for your article
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setArticleTheme('v1')}
                                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                            articleTheme === 'v1'
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                            articleTheme === 'v1' ? 'bg-blue-100' : 'bg-gray-100'
                                        }`}>
                                            <FileText className={`w-5 h-5 ${articleTheme === 'v1' ? 'text-blue-600' : 'text-gray-500'}`} />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Standard Blog (V1)</h3>
                                        <p className="text-sm text-gray-500 mt-1">Clean article format with basic HTML formatting</p>
                                        {articleTheme === 'v1' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setArticleTheme('v2')}
                                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                            articleTheme === 'v2'
                                                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                            articleTheme === 'v2' ? 'bg-emerald-100' : 'bg-gray-100'
                                        }`}>
                                            <FlaskConical className={`w-5 h-5 ${articleTheme === 'v2' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Scientific Advertorial (V2)</h3>
                                        <p className="text-sm text-gray-500 mt-1">Rich components: tables, timelines, icon lists</p>
                                        {articleTheme === 'v2' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">Tables</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">Timelines</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">Icons</span>
                                        </div>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Article Content */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Article Content</CardTitle>
                                <CardDescription>Paste your raw text and let AI format it into a polished article</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Custom Slug (Optional)</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                            /articles/
                                        </span>
                                        <Input
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                            className="rounded-l-none"
                                            placeholder="my-article-slug"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Leave blank to auto-generate from title</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Advertorial Text</Label>
                                    <Textarea
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                        className="min-h-[250px] resize-y"
                                        placeholder="Paste your raw article text here. The AI will format it, generate a title, and create comments..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* ─── SHARED: Domain Selection ─── */}
                {domains.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-purple-500" />
                                Domain & Branding
                            </CardTitle>
                            <CardDescription>Choose which domain this article will be published under</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedDomainId || "auto"} onValueChange={(val) => setSelectedDomainId(val === "auto" ? "" : val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a domain..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto-detect from URL</SelectItem>
                                    {domains.map(d => (
                                        <SelectItem key={d.id} value={d.id}>
                                            <span className="flex items-center gap-2">
                                                <span className="inline-flex w-4 h-4 rounded-sm text-white text-[8px] items-center justify-center font-bold" style={{ backgroundColor: d.logo_color }}>
                                                    {d.logo_letter}
                                                </span>
                                                {d.brand_name} — {d.domain}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                )}

                {/* ─── SHARED: Tracking & CTA ─── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tracking & CTA</CardTitle>
                        <CardDescription>
                            {creationMode === 'ai-write'
                                ? 'The CTA URL is required — AI will analyze the product page to write the advertorial'
                                : 'Configure the Facebook Pixel and call-to-action for this article'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Pixel Selection */}
                        <div className="space-y-2">
                            <Label>Facebook Pixel ID</Label>
                            {!isAddingPixel ? (
                                <div className="flex gap-2">
                                    <Select value={selectedPixel} onValueChange={setSelectedPixel}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select a pixel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pixels.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={() => setIsAddingPixel(true)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={newPixel}
                                        onChange={(e) => setNewPixel(e.target.value)}
                                        placeholder="Enter new Pixel ID"
                                        className="flex-1"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddPixel()}
                                    />
                                    <Button onClick={handleAddPixel}>Add</Button>
                                    <Button variant="ghost" size="icon" onClick={() => setIsAddingPixel(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* CTA URL Selection */}
                        <div className="space-y-2">
                            <Label>
                                CTA URL {creationMode === 'ai-write' && <span className="text-red-500">*</span>}
                            </Label>
                            {!isAddingCta ? (
                                <div className="flex gap-2">
                                    <Select value={selectedCta} onValueChange={setSelectedCta}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select a CTA URL" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ctas.map(c => (
                                                <SelectItem key={c} value={c}>
                                                    <span className="truncate max-w-[300px] block">{c}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={() => setIsAddingCta(true)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={newCta}
                                        onChange={(e) => setNewCta(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCta()}
                                    />
                                    <Button onClick={handleAddCta}>Add</Button>
                                    <Button variant="ghost" size="icon" onClick={() => setIsAddingCta(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            {creationMode === 'ai-write' && (
                                <p className="text-xs text-muted-foreground">
                                    AI will scrape this URL to understand the product and write a tailored advertorial
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    size="lg"
                    className={`w-full ${creationMode === 'ai-write' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                >
                    <Sparkles className="mr-2 h-5 w-5" />
                    {creationMode === 'ai-write'
                        ? 'Generate Advertorial with Claude Opus'
                        : `Generate ${articleTheme === 'v2' ? 'V2 Advertorial' : 'Article'} with AI`
                    }
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                    {creationMode === 'ai-write'
                        ? 'Claude Opus 4.6 writes the article. Nano Banana Pro generates images. Full automation.'
                        : `Powered by Nano Banana Pro. ${articleTheme === 'v2'
                            ? 'Generates rich components, title, and comments automatically.'
                            : 'Generates title, content, and comments automatically.'}`
                    }
                </p>
            </div>
        </>
    );
}
