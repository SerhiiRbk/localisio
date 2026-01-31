// ============================================================
// Nominatim Geocoding Provider
// ============================================================

import type {
  GeocodingProvider,
  GeoSearchParams,
  GeoSearchResult,
  GeoLocation,
  NominatimSearchResult,
  NominatimAddress,
  PlaceType,
  ALLOWED_PLACE_TYPES,
  CacheEntry,
} from './types';

// ============================================================
// Configuration
// ============================================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'Localisio/1.0 (https://localis.io)';

// Request timeout (ms)
const REQUEST_TIMEOUT_MS = 5000;

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_ENTRIES = 1000;

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5; // failures before opening circuit
const CIRCUIT_BREAKER_RESET_MS = 60000; // 1 minute

// In-memory cache
const searchCache = new Map<string, CacheEntry<GeoSearchResult[]>>();

// Circuit breaker state
let circuitBreakerFailures = 0;
let circuitBreakerOpenedAt: number | null = null;

// ============================================================
// Circuit Breaker
// ============================================================

function isCircuitOpen(): boolean {
  if (circuitBreakerOpenedAt === null) {
    return false;
  }
  
  // Check if circuit should be reset (half-open state)
  if (Date.now() - circuitBreakerOpenedAt > CIRCUIT_BREAKER_RESET_MS) {
    circuitBreakerOpenedAt = null;
    circuitBreakerFailures = 0;
    return false;
  }
  
  return true;
}

function recordFailure(): void {
  circuitBreakerFailures++;
  if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerOpenedAt = Date.now();
    console.warn('Nominatim circuit breaker opened due to repeated failures');
  }
}

function recordSuccess(): void {
  circuitBreakerFailures = 0;
  circuitBreakerOpenedAt = null;
}

// ============================================================
// Fetch with timeout
// ============================================================

async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// Cache Management
// ============================================================

function getCacheKey(params: GeoSearchParams): string {
  const parts = [
    params.query.toLowerCase().trim(),
    params.countryCode || '',
    params.language || 'en',
    params.limit || 10,
  ];
  return parts.join(':');
}

function getFromCache(key: string): GeoSearchResult[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: GeoSearchResult[]): void {
  // Evict oldest entries if cache is full
  if (searchCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) {
      searchCache.delete(oldestKey);
    }
  }
  
  searchCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Extract city name from Nominatim address
 * Nominatim returns different fields depending on place type
 */
function extractCityName(address: NominatimAddress, name: string): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    name ||
    ''
  );
}

/**
 * Determine place type from Nominatim result
 */
function getPlaceType(result: NominatimSearchResult): PlaceType | null {
  const { addresstype, type } = result;
  
  // Check addresstype first (more reliable)
  const typeMap: Record<string, PlaceType> = {
    city: 'city',
    town: 'town',
    village: 'village',
    municipality: 'municipality',
    hamlet: 'hamlet',
    suburb: 'suburb',
    district: 'district',
  };
  
  if (addresstype in typeMap) {
    return typeMap[addresstype];
  }
  
  if (type in typeMap) {
    return typeMap[type];
  }
  
  // For place class, check type
  if (result.class === 'place') {
    if (type in typeMap) {
      return typeMap[type];
    }
  }
  
  return null;
}

/**
 * Check if place type is allowed
 */
function isAllowedPlaceType(placeType: PlaceType | null): boolean {
  if (!placeType) return false;
  const allowed: PlaceType[] = ['city', 'town', 'village', 'municipality'];
  return allowed.includes(placeType);
}

/**
 * Get OSM type prefix: R (relation), W (way), N (node)
 * Relation is preferred as it represents administrative boundaries
 */
function getOsmTypePrefix(osmType: string): string {
  const typeMap: Record<string, string> = {
    relation: 'R',
    way: 'W',
    node: 'N',
  };
  return typeMap[osmType.toLowerCase()] || 'N';
}

/**
 * Create stable place_id from OSM type and ID
 * Format: "R435514" (R=relation, 435514=osm_id)
 * This is stable across Nominatim instances and query variations
 */
function createStablePlaceId(osmType: string, osmId: number | string): string {
  const prefix = getOsmTypePrefix(osmType);
  return `${prefix}${osmId}`;
}

/**
 * Transform Nominatim result to GeoSearchResult
 */
function transformResult(result: NominatimSearchResult): GeoSearchResult | null {
  const placeType = getPlaceType(result);
  
  // Skip non-place results
  if (!isAllowedPlaceType(placeType)) {
    return null;
  }
  
  const cityName = extractCityName(result.address, result.name);
  const countryCode = (result.address.country_code || '').toUpperCase();
  const countryName = result.address.country || '';
  
  if (!cityName || !countryCode) {
    return null;
  }
  
  // Validate osm_id exists
  if (!result.osm_id || !result.osm_type) {
    console.warn('Nominatim result missing osm_id or osm_type:', result.place_id);
    return null;
  }
  
  const osmType = getOsmTypePrefix(result.osm_type);
  const osmId = result.osm_id.toString();
  const stablePlaceId = createStablePlaceId(result.osm_type, result.osm_id);
  
  return {
    place_id: stablePlaceId,
    nominatim_place_id: result.place_id.toString(),
    osm_type: osmType,
    osm_id: osmId,
    display_name: result.display_name,
    city_name: cityName,
    country_code: countryCode,
    country_name: countryName,
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    place_type: placeType!,
    label: `${cityName}, ${countryName}`,
  };
}

// ============================================================
// Nominatim Provider
// ============================================================

export const nominatimProvider: GeocodingProvider = {
  name: 'nominatim',
  
  async search(params: GeoSearchParams): Promise<GeoSearchResult[]> {
    const { query, countryCode, language = 'en', limit = 10 } = params;
    
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    // Check cache first (works even if circuit is open)
    const cacheKey = getCacheKey(params);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Check circuit breaker
    if (isCircuitOpen()) {
      console.warn('Nominatim circuit breaker is open, returning empty results');
      return [];
    }
    
    // Build Nominatim URL
    // Note: Don't use featuretype=city as it's too restrictive for partial/Cyrillic queries
    // Instead, we filter results client-side with isAllowedPlaceType()
    const buildSearchParams = (includeCountry: boolean) => {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        addressdetails: '1',
        limit: Math.min(limit * 3, 30).toString(), // Request more since we filter
        dedupe: '1', // Prevent duplicate results
        'accept-language': language, // Also as URL param for better localization
      });
      
      // Add country filter if specified
      if (includeCountry && countryCode) {
        params.set('countrycodes', countryCode.toLowerCase());
      }
      
      return params;
    };
    
    const searchWithParams = async (params: URLSearchParams): Promise<NominatimSearchResult[]> => {
      const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;
      
      const response = await fetchWithTimeout(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language,
          'User-Agent': USER_AGENT,
        },
      });
      
      if (!response.ok) {
        console.error(`Nominatim API error: ${response.status}`);
        recordFailure();
        return [];
      }
      
      return response.json();
    };
    
    try {
      // First try with country filter
      let data = await searchWithParams(buildSearchParams(true));
      
      // If no results and country filter was used, try without it
      // This helps with transliterated names (e.g., "Копенгаген" for "København")
      if (data.length === 0 && countryCode) {
        data = await searchWithParams(buildSearchParams(false));
        
        // Filter results to only include the requested country
        if (countryCode) {
          data = data.filter(item => 
            item.address?.country_code?.toLowerCase() === countryCode.toLowerCase()
          );
        }
      }
      
      // Transform and filter results
      // Use a map to deduplicate by city_name:country_code, preferring relations over nodes
      const cityMap = new Map<string, GeoSearchResult>();
      
      // OSM type priority: R (relation) > W (way) > N (node)
      // Relations represent administrative boundaries, which are more accurate
      const osmTypePriority: Record<string, number> = { R: 3, W: 2, N: 1 };
      
      for (const item of data) {
        const result = transformResult(item);
        if (result) {
          // Deduplicate by city_name + country_code, keeping the one with higher priority
          const key = `${result.city_name.toLowerCase()}:${result.country_code}`;
          const existing = cityMap.get(key);
          
          if (!existing) {
            cityMap.set(key, result);
          } else {
            // Replace if current result has higher priority (prefer relations)
            const existingPriority = osmTypePriority[existing.osm_type] || 0;
            const currentPriority = osmTypePriority[result.osm_type] || 0;
            if (currentPriority > existingPriority) {
              cityMap.set(key, result);
            }
          }
        }
      }
      
      // Convert map to array and limit results
      const results = Array.from(cityMap.values()).slice(0, limit);
      
      // Cache results and record success
      setCache(cacheKey, results);
      recordSuccess();
      
      return results;
    } catch (error) {
      // Handle timeout separately
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Nominatim request timeout');
      } else {
        console.error('Nominatim search error:', error);
      }
      recordFailure();
      return [];
    }
  },
  
  async getPlaceDetails(placeId: string, language = 'en'): Promise<GeoLocation | null> {
    // Parse place_id format: "R435514" -> osm_type=relation, osm_id=435514
    // Legacy format (numeric string) is also supported for backward compatibility
    if (!placeId) {
      console.warn('Empty place_id');
      return null;
    }
    
    let osmType: string;
    let osmId: string;
    
    // Check if it's the new format (R/W/N + number)
    const match = placeId.match(/^([RWN])(\d+)$/i);
    if (match) {
      const typeMap: Record<string, string> = { R: 'relation', W: 'way', N: 'node' };
      osmType = typeMap[match[1].toUpperCase()] || 'node';
      osmId = match[2];
    } else if (/^\d+$/.test(placeId)) {
      // Legacy numeric format - use as nominatim place_id directly
      console.warn('Legacy numeric place_id format, consider migrating to OSM ID format');
      
      if (isCircuitOpen()) {
        return null;
      }
      
      const searchParams = new URLSearchParams({
        place_id: placeId,
        format: 'json',
        addressdetails: '1',
      });
      
      const url = `${NOMINATIM_BASE_URL}/details?${searchParams.toString()}`;
      
      try {
        const response = await fetchWithTimeout(url, {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': language,
            'User-Agent': USER_AGENT,
          },
        });
        
        if (!response.ok) {
          recordFailure();
          return null;
        }
        
        const data = await response.json();
        recordSuccess();
        
        const placeType = getPlaceType(data);
        const address = data.address || {};
        const cityName = extractCityName(address, data.name || data.names?.name);
        
        return {
          place_id: placeId,
          display_name: data.localname || data.name || cityName,
          city_name: cityName,
          country_code: (address.country_code || '').toUpperCase(),
          country_name: address.country || '',
          lat: parseFloat(data.centroid?.coordinates?.[1] || data.lat || 0),
          lon: parseFloat(data.centroid?.coordinates?.[0] || data.lon || 0),
          place_type: placeType || 'city',
          osm_type: data.osm_type,
          osm_id: data.osm_id?.toString(),
        };
      } catch (error) {
        console.error('Nominatim details error:', error);
        recordFailure();
        return null;
      }
    } else {
      console.warn('Invalid place_id format:', placeId);
      return null;
    }
    
    if (isCircuitOpen()) {
      return null;
    }
    
    // Use lookup endpoint with OSM type and ID (more reliable than place_id)
    const searchParams = new URLSearchParams({
      osm_ids: `${osmType[0].toUpperCase()}${osmId}`,
      format: 'json',
      addressdetails: '1',
    });
    
    const url = `${NOMINATIM_BASE_URL}/lookup?${searchParams.toString()}`;
    
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language,
          'User-Agent': USER_AGENT,
        },
      });
      
      if (!response.ok) {
        recordFailure();
        return null;
      }
      
      const dataArray = await response.json();
      recordSuccess();
      
      // Lookup returns an array
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return null;
      }
      
      const data = dataArray[0];
      
      // Transform to GeoLocation
      const placeType = getPlaceType(data);
      const address = data.address || {};
      const cityName = extractCityName(address, data.name);
      
      return {
        place_id: placeId,
        display_name: data.display_name || cityName,
        city_name: cityName,
        country_code: (address.country_code || '').toUpperCase(),
        country_name: address.country || '',
        lat: parseFloat(data.lat || 0),
        lon: parseFloat(data.lon || 0),
        place_type: placeType || 'city',
        osm_type: getOsmTypePrefix(data.osm_type || 'node'),
        osm_id: data.osm_id?.toString(),
      };
    } catch (error) {
      console.error('Nominatim lookup error:', error);
      recordFailure();
      return null;
    }
  },
  
  async reverseGeocode(lat: number, lon: number, language = 'en'): Promise<GeoLocation | null> {
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lon !== 'number' || 
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.warn('Invalid coordinates:', { lat, lon });
      return null;
    }
    
    if (isCircuitOpen()) {
      return null;
    }
    
    const searchParams = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '10', // City level
    });
    
    const url = `${NOMINATIM_BASE_URL}/reverse?${searchParams.toString()}`;
    
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language,
          'User-Agent': USER_AGENT,
        },
      });
      
      if (!response.ok) {
        recordFailure();
        return null;
      }
      
      const data: NominatimSearchResult = await response.json();
      recordSuccess();
      
      const result = transformResult(data);
      
      if (!result) {
        return null;
      }
      
      // result already has correctly formatted osm_type (R/W/N) and osm_id from transformResult
      return result;
    } catch (error) {
      console.error('Nominatim reverse geocode error:', error);
      recordFailure();
      return null;
    }
  },
};

// ============================================================
// Health check and monitoring
// ============================================================

/**
 * Get circuit breaker status for monitoring
 */
export function getCircuitBreakerStatus(): {
  isOpen: boolean;
  failures: number;
  openedAt: number | null;
} {
  return {
    isOpen: isCircuitOpen(),
    failures: circuitBreakerFailures,
    openedAt: circuitBreakerOpenedAt,
  };
}

/**
 * Manually reset circuit breaker (for admin use)
 */
export function resetCircuitBreaker(): void {
  circuitBreakerFailures = 0;
  circuitBreakerOpenedAt = null;
}

// ============================================================
// Provider factory (for future extensibility)
// ============================================================

export type GeocodingProviderName = 'nominatim' | 'mapbox';

const providers: Record<string, GeocodingProvider> = {
  nominatim: nominatimProvider,
};

export function getGeocodingProvider(name: GeocodingProviderName = 'nominatim'): GeocodingProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown geocoding provider: ${name}`);
  }
  return provider;
}

// Default export
export default nominatimProvider;
