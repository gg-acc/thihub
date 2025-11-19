'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Config {
    default: string;
    articles: Record<string, string>;
}

interface Article {
    slug: string;
    title: string;
}

export default function AdminDashboard() {
    const [config, setConfig] = useState<Config>({ default: '', articles: {} });
    const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSlug, setNewSlug] = useState('');
    const [newPixel, setNewPixel] = useState('');
    const router = useRouter();

    useEffect(() => {
        Promise.all([
            fetch('/api/config').then((res) => res.json()),
            fetch('/api/articles').then((res) => res.json())
        ])
            .then(([configData, articlesData]) => {
                setConfig(configData);
                setAvailableArticles(articlesData);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const saveConfig = async (newConfig: Config) => {
        setConfig(newConfig);
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig),
        });
    };

    const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        saveConfig({ ...config, default: e.target.value });
    };

    const handleArticleChange = (slug: string, pixelId: string) => {
        const newArticles = { ...config.articles, [slug]: pixelId };
        saveConfig({ ...config, articles: newArticles });
    };

    const handleAddArticle = () => {
        if (newSlug && newPixel) {
            const newArticles = { ...config.articles, [newSlug]: newPixel };
            saveConfig({ ...config, articles: newArticles });
            setNewSlug('');
            setNewPixel('');
        }
    };

    const handleDeleteArticle = (slug: string) => {
        const newArticles = { ...config.articles };
        delete newArticles[slug];
        saveConfig({ ...config, articles: newArticles });
    };

    const handleLogout = async () => {
        // In a real app, call an API to clear cookie. 
        // For now, we can just redirect to login which will overwrite/clear if we implemented a logout route, 
        // but simple client-side redirect works for this demo if we assume the cookie expires or we manually clear it.
        // Actually, let's just force a reload or redirect.
        // To properly logout, we should clear the cookie.
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/admin/login');
    };

    if (loading) return <div className="p-8 flex justify-center text-gray-500">Loading configuration...</div>;

    // Merge available articles with configured overrides to show a complete list
    const allSlugs = Array.from(new Set([
        ...availableArticles.map(a => a.slug),
        ...Object.keys(config.articles)
    ]));

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-900 text-sm font-medium">View Site</button>
                            <button onClick={handleLogout} className="text-red-600 hover:text-red-800 text-sm font-medium">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

                {/* Default Pixel Config */}
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 mb-8 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Global Configuration</h3>
                        <p className="mt-1 text-sm text-gray-500">This Pixel ID will be used for all articles unless overridden below.</p>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Default Pixel ID</label>
                        <input
                            type="text"
                            value={config.default}
                            onChange={handleDefaultChange}
                            className="block w-full max-w-md rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                            placeholder="e.g. 1234567890"
                        />
                    </div>
                </div>

                {/* Article Management */}
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Article Management</h3>
                            <p className="mt-1 text-sm text-gray-500">Manage Pixel IDs for your articles.</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {allSlugs.length} Articles Found
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {allSlugs.length === 0 && (
                            <div className="p-8 text-center text-gray-500 italic">
                                No articles found in database or configuration.
                            </div>
                        )}

                        {allSlugs.map((slug) => {
                            const article = availableArticles.find(a => a.slug === slug);
                            const pixelId = config.articles[slug] || '';
                            const isOverridden = !!config.articles[slug];

                            return (
                                <div key={slug} className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isOverridden ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                                    <div className="flex-1 grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Article</label>
                                            <div className="font-bold text-gray-900">{article ? article.title : slug}</div>
                                            <div className="font-mono text-xs text-gray-500 mt-1">{slug}</div>
                                            {!article && <span className="text-xs text-amber-600 font-medium mt-1 inline-block">⚠ Not in DB (Config only)</span>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                                Pixel ID {isOverridden ? '(Overridden)' : '(Using Default)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={pixelId}
                                                placeholder={config.default}
                                                onChange={(e) => handleArticleChange(slug, e.target.value)}
                                                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1.5 border ${isOverridden ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50 text-gray-500'}`}
                                            />
                                        </div>
                                    </div>
                                    {isOverridden && (
                                        <button
                                            onClick={() => handleDeleteArticle(slug)}
                                            className="text-red-600 hover:text-red-900 text-sm font-bold px-3 py-2 rounded hover:bg-red-50 transition-colors"
                                        >
                                            Reset to Default
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Manual Override (for testing or hidden articles) */}
                        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">Add Manual Override (Advanced)</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Slug (e.g. hidden-page)"
                                    value={newSlug}
                                    onChange={(e) => setNewSlug(e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                                />
                                <input
                                    type="text"
                                    placeholder="Pixel ID"
                                    value={newPixel}
                                    onChange={(e) => setNewPixel(e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                                />
                                <button
                                    onClick={handleAddArticle}
                                    disabled={!newSlug || !newPixel}
                                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
