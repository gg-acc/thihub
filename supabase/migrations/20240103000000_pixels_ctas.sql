-- Create pixels table for storing Facebook Pixel IDs with custom names
CREATE TABLE IF NOT EXISTS pixels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pixel_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cta_urls table for storing CTA URLs
CREATE TABLE IF NOT EXISTS cta_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE cta_urls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pixels
CREATE POLICY "Allow authenticated users to read pixels"
    ON pixels FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert pixels"
    ON pixels FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pixels"
    ON pixels FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete pixels"
    ON pixels FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies for cta_urls
CREATE POLICY "Allow authenticated users to read cta_urls"
    ON cta_urls FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert cta_urls"
    ON cta_urls FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cta_urls"
    ON cta_urls FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete cta_urls"
    ON cta_urls FOR DELETE
    TO authenticated
    USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pixels_pixel_id ON pixels(pixel_id);
CREATE INDEX IF NOT EXISTS idx_cta_urls_url ON cta_urls(url);

