import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'data', 'pixel-config.json');

export async function GET() {
    try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(fileContents);
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ default: "1213472546398709", articles: {} });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        fs.writeFileSync(configPath, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
