import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint sets up the quiz tables in Supabase
// Run it once by visiting /api/setup-quiz-tables
export async function GET() {
    try {
        // Create admin client with service role key for DDL operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Create quizzes table
        const { error: quizzesError } = await supabaseAdmin.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS quizzes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    settings JSONB DEFAULT '{"primaryColor": "#0F4C81", "backgroundColor": "#ffffff", "showProgressBar": true, "allowBack": false}'::jsonb,
                    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        // If RPC doesn't work, try direct SQL via REST
        // The tables might need to be created via Supabase Dashboard SQL Editor
        
        // For now, let's just try to select from the tables to check if they exist
        const { data: quizCheck, error: checkError } = await supabaseAdmin
            .from('quizzes')
            .select('id')
            .limit(1);

        if (checkError && checkError.code === '42P01') {
            // Table doesn't exist - return SQL for manual execution
            return NextResponse.json({
                success: false,
                message: 'Tables do not exist. Please run the following SQL in your Supabase Dashboard SQL Editor:',
                sql: `
-- Quiz Funnel Builder Tables

-- Main quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{"primaryColor": "#0F4C81", "backgroundColor": "#ffffff", "showProgressBar": true, "allowBack": false}'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz slides table
CREATE TABLE IF NOT EXISTS quiz_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    slide_order INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text-choice', 'image-choice', 'multi-select', 'info', 'loading', 'results', 'offer')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    conditional_logic JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, slide_order)
);

-- Quiz responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_slide INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    user_agent TEXT,
    ip_address TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_slides_quiz_id ON quiz_slides(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_slides_order ON quiz_slides(quiz_id, slide_order);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session ON quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON quizzes(slug);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_slides_updated_at ON quiz_slides;
CREATE TRIGGER update_quiz_slides_updated_at
    BEFORE UPDATE ON quiz_slides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on quizzes" ON quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on quiz_slides" ON quiz_slides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on quiz_responses" ON quiz_responses FOR ALL USING (true) WITH CHECK (true);
`
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Quiz tables already exist! You can start creating quizzes at /admin/quizzes'
        });

    } catch (e: any) {
        console.error('Setup error:', e);
        return NextResponse.json({
            success: false,
            error: e.message
        }, { status: 500 });
    }
}

