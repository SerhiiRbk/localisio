-- ============================================================
-- Migration: Provider FAQ
-- Description: Add FAQ section to provider profiles
-- ============================================================

-- Add faq column as JSONB array
-- Format: [{"question": "...", "answer": "..."}, ...]
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;

-- Add constraint to limit FAQ items to 5
ALTER TABLE provider_profiles
ADD CONSTRAINT provider_faq_max_items 
CHECK (jsonb_array_length(COALESCE(faq, '[]'::jsonb)) <= 5);

-- Create index for non-empty FAQs (for potential filtering)
CREATE INDEX IF NOT EXISTS idx_provider_profiles_has_faq 
ON provider_profiles ((jsonb_array_length(faq) > 0)) 
WHERE jsonb_array_length(faq) > 0;

-- Comment on column
COMMENT ON COLUMN provider_profiles.faq IS 'FAQ items as JSONB array: [{question: string, answer: string}]. Max 5 items, max 2500 total characters.';
