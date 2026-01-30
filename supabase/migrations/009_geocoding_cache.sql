-- ============================================================
-- Migration: Geocoding Cache
-- Description: Cache geocoding results in database to reduce
--              Nominatim API calls and improve performance
-- ============================================================

-- Create geocoding cache table
CREATE TABLE IF NOT EXISTS geocoding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache key (unique identifier for the query)
  cache_key TEXT UNIQUE NOT NULL,
  
  -- Search parameters
  query TEXT NOT NULL,
  country_code TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  
  -- Results stored as JSONB array
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Index for faster lookups
  CONSTRAINT geocoding_cache_query_length CHECK (char_length(query) >= 2)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_key ON geocoding_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_expires ON geocoding_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_query ON geocoding_cache(query);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_geocoding_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM geocoding_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cached geocoding results
CREATE OR REPLACE FUNCTION get_geocoding_cache(
  p_cache_key TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_results JSONB;
BEGIN
  SELECT results INTO v_results
  FROM geocoding_cache
  WHERE cache_key = p_cache_key
    AND expires_at > NOW();
  
  RETURN v_results;
END;
$$ LANGUAGE plpgsql;

-- Function to set geocoding cache
CREATE OR REPLACE FUNCTION set_geocoding_cache(
  p_cache_key TEXT,
  p_query TEXT,
  p_country_code TEXT,
  p_language TEXT,
  p_results JSONB,
  p_ttl_hours INTEGER DEFAULT 24
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO geocoding_cache (
    cache_key,
    query,
    country_code,
    language,
    results,
    expires_at
  ) VALUES (
    p_cache_key,
    p_query,
    p_country_code,
    p_language,
    p_results,
    NOW() + (p_ttl_hours || ' hours')::INTERVAL
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET
    results = EXCLUDED.results,
    expires_at = NOW() + (p_ttl_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE geocoding_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users
CREATE POLICY "geocoding_cache_read_all" ON geocoding_cache
  FOR SELECT
  USING (true);

-- Policy: Allow insert/update from service role only (API routes)
CREATE POLICY "geocoding_cache_insert_service" ON geocoding_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "geocoding_cache_update_service" ON geocoding_cache
  FOR UPDATE
  USING (true);

-- Grant permissions
GRANT SELECT ON geocoding_cache TO authenticated;
GRANT SELECT ON geocoding_cache TO anon;
GRANT ALL ON geocoding_cache TO service_role;

-- Comment on table
COMMENT ON TABLE geocoding_cache IS 'Cache for geocoding API results to reduce external API calls';
COMMENT ON COLUMN geocoding_cache.cache_key IS 'Unique key: query:country:language (lowercase, trimmed)';
COMMENT ON COLUMN geocoding_cache.results IS 'JSONB array of GeoSearchResult objects';
COMMENT ON COLUMN geocoding_cache.expires_at IS 'Cache expiration time (default 24 hours)';
