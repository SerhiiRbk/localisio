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

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_ENTRIES = 1000;

// In-memory cache
const searchCache = new Map<string, CacheEntry<GeoSearchResult[]>>();

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
  
  return {
    place_id: result.place_id.toString(),
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
    
    // Check cache
    const cacheKey = getCacheKey(params);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Build Nominatim URL
    const searchParams = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      limit: Math.min(limit * 2, 20).toString(), // Request more, filter later
      featuretype: 'city', // Focus on cities (also returns towns, villages)
    });
    
    // Add country filter if specified
    if (countryCode) {
      searchParams.set('countrycodes', countryCode.toLowerCase());
    }
    
    const url = `${NOMINATIM_BASE_URL}/search?${searchParams.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language,
          'User-Agent': USER_AGENT,
        },
      });
      
      if (!response.ok) {
        console.error(`Nominatim API error: ${response.status}`);
        return [];
      }
      
      const data: NominatimSearchResult[] = await response.json();
      
      // Transform and filter results
      const results: GeoSearchResult[] = [];
      const seenCities = new Set<string>();
      
      for (const item of data) {
        const result = transformResult(item);
        if (result) {
          // Deduplicate by city_name + country_code
          const key = `${result.city_name.toLowerCase()}:${result.country_code}`;
          if (!seenCities.has(key)) {
            seenCities.add(key);
            results.push(result);
          }
        }
        
        if (results.length >= limit) break;
      }
      
      // Cache results
      setCache(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('Nominatim search error:', error);
      return [];
    }
  },
  
  async getPlaceDetails(placeId: string, language = 'en'): Promise<GeoLocation | null> {
    const searchParams = new URLSearchParams({
      place_id: placeId,
      format: 'json',
      addressdetails: '1',
    });
    
    const url = `${NOMINATIM_BASE_URL}/details?${searchParams.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language,
          'User-Agent': USER_AGENT,
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      // Transform to GeoLocation
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
      return null;
    }
  },
  
  async reverseGeocode(lat: number, lon: number, language = 'en'): Promise<GeoLocation | null> {
    const searchParams = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '10', // City level
    });
    
    const url = `${NOMINATIM_BASE_URL}/reverse?${searchParams.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language,
          'User-Agent': USER_AGENT,
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data: NominatimSearchResult = await response.json();
      const result = transformResult(data);
      
      if (!result) {
        return null;
      }
      
      return {
        ...result,
        osm_type: data.osm_type,
        osm_id: data.osm_id?.toString(),
      };
    } catch (error) {
      console.error('Nominatim reverse geocode error:', error);
      return null;
    }
  },
};

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
