import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
        if (fs.existsSync(articlesPath)) {
            const fileContents = fs.readFileSync(articlesPath, 'utf8');
            const articles = JSON.parse(fileContents);
            // Return list of slugs and titles
            const articleList = articles.map((a: any) => ({ slug: a.slug, title: a.title }));
            return NextResponse.json(articleList);
        }
        return NextResponse.json([]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to read articles" }, { status: 500 });
    }
}
