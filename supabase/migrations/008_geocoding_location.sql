-- ============================================================
-- Geocoding Location Enhancement Migration
-- ============================================================
-- This migration adds proper geocoded location fields to provider_profiles
-- to enable language-independent city search via canonical place IDs.
--
-- IMPORTANT: This migration does NOT use PostGIS (not standard in Supabase).
-- For geo-proximity search, we use the built-in Postgres point operations
-- or can upgrade to PostGIS later if needed.
-- ============================================================

-- ============================================================
-- 1) Add new geocoded location columns to provider_profiles
-- ============================================================

-- Add canonical location fields
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS city_place_id TEXT,           -- Nominatim place_id (canonical ID)
  ADD COLUMN IF NOT EXISTS city_display_name TEXT,       -- Full display name from geocoder
  ADD COLUMN IF NOT EXISTS city_name_normalized TEXT,    -- Normalized city name for search
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,         -- Latitude
  ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION,         -- Longitude
  ADD COLUMN IF NOT EXISTS location_point POINT;         -- Native Postgres POINT for geo queries

-- ============================================================
-- 2) Add indexes for efficient location-based queries
-- ============================================================

-- Index for exact match on city_place_id (primary lookup)
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city_place_id 
  ON provider_profiles(city_place_id)
  WHERE city_place_id IS NOT NULL;

-- Composite index for country + city lookup
CREATE INDEX IF NOT EXISTS idx_provider_profiles_country_city 
  ON provider_profiles(country_code, city_place_id)
  WHERE country_code != '' AND city_place_id IS NOT NULL;

-- Index for city_name_normalized (for text search fallback)
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city_normalized 
  ON provider_profiles(city_name_normalized)
  WHERE city_name_normalized IS NOT NULL;

-- GiST index for point-based geo queries (for "nearby" search)
-- Note: For simple distance queries, we can use standard Postgres point operators
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location 
  ON provider_profiles USING GIST(location_point)
  WHERE location_point IS NOT NULL;

-- ============================================================
-- 3) Function to update location_point from lat/lon
-- ============================================================

CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
  -- Update location_point when lat/lon change
  IF NEW.lat IS NOT NULL AND NEW.lon IS NOT NULL THEN
    NEW.location_point = POINT(NEW.lon, NEW.lat);
  ELSE
    NEW.location_point = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update location_point
DROP TRIGGER IF EXISTS trigger_update_location_point ON provider_profiles;
CREATE TRIGGER trigger_update_location_point
  BEFORE INSERT OR UPDATE OF lat, lon ON provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_location_point();

-- ============================================================
-- 4) Migrate existing city data (optional - mark as normalized)
-- ============================================================

-- Normalize existing city values for text search
UPDATE provider_profiles 
SET city_name_normalized = LOWER(TRIM(city))
WHERE city IS NOT NULL AND city != '' AND city_name_normalized IS NULL;

-- ============================================================
-- 5) Helper function for distance calculation (in km)
-- ============================================================

-- Haversine formula for distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  R CONSTANT DOUBLE PRECISION := 6371; -- Earth radius in km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat/2) * SIN(dlat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       SIN(dlon/2) * SIN(dlon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 6) Function to search providers by location
-- ============================================================

-- Search providers within radius (km) of a point
CREATE OR REPLACE FUNCTION search_providers_near_location(
  search_lat DOUBLE PRECISION,
  search_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.user_id,
    calculate_distance_km(search_lat, search_lon, pp.lat, pp.lon) AS distance_km
  FROM provider_profiles pp
  WHERE 
    pp.lat IS NOT NULL 
    AND pp.lon IS NOT NULL
    AND pp.is_hidden = FALSE
    AND calculate_distance_km(search_lat, search_lon, pp.lat, pp.lon) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- SCHEMA DOCUMENTATION
-- ============================================================
/*
New Location Fields in provider_profiles:

1. city_place_id (TEXT)
   - Primary identifier from Nominatim (place_id)
   - Used for exact match search: "Prague" = "Praha" = "Прага"
   - Can change if Nominatim reindexes (rare)
   - Store as TEXT, not INTEGER, for flexibility
   
2. city_display_name (TEXT)
   - Full display string from geocoder
   - "Prague, Praha, Hlavní město Praha, Czechia"
   - For display purposes and debugging

3. city_name_normalized (TEXT)
   - Lowercase city name for text search fallback
   - If user hasn't selected from autocomplete

4. lat, lon (DOUBLE PRECISION)
   - Geographic coordinates
   - For "nearby" search and map display

5. location_point (POINT)
   - Native Postgres point type
   - Enables GiST index for geo queries
   - Auto-updated via trigger

USAGE:

1. For display: Use city (existing field) + country_code
2. For filtering: Use city_place_id (exact match)
3. For nearby search: Use search_providers_near_location()
4. For fallback: Use city_name_normalized with ILIKE

FUTURE UPGRADE TO POSTGIS:

If you need more advanced geo features:
1. Enable PostGIS extension
2. ALTER COLUMN location_point TYPE geography(Point, 4326)
3. Update the distance function to use ST_Distance
4. The GiST index will work with geography type
*/
