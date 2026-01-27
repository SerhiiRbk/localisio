// ============================================================
// Geocoding Types and Interfaces
// ============================================================

/**
 * Canonical location data structure
 * Used for storing selected city information in the database
 */
export interface GeoLocation {
  /** Nominatim place_id or other provider's unique identifier */
  place_id: string;
  /** Full display name from geocoder (e.g., "Prague, Praha, Hlavní město Praha, Czechia") */
  display_name: string;
  /** City/town/village name in local language */
  city_name: string;
  /** City name in English (if available) */
  city_name_en?: string;
  /** ISO 3166-1 alpha-2 country code (uppercase) */
  country_code: string;
  /** Country name in local language */
  country_name: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Type of place: city, town, village, municipality */
  place_type: PlaceType;
  /** OSM type (node, way, relation) */
  osm_type?: string;
  /** OSM ID */
  osm_id?: string;
}

/**
 * Place types returned by Nominatim
 * We filter to only show populated places
 */
export type PlaceType = 'city' | 'town' | 'village' | 'municipality' | 'hamlet' | 'suburb' | 'district';

/**
 * Allowed place types for filtering
 */
export const ALLOWED_PLACE_TYPES: PlaceType[] = ['city', 'town', 'village', 'municipality'];

/**
 * Search result from geocoding API (used in autocomplete)
 */
export interface GeoSearchResult {
  place_id: string;
  display_name: string;
  city_name: string;
  country_code: string;
  country_name: string;
  lat: number;
  lon: number;
  place_type: PlaceType;
  /** Formatted label for display: "City, Country" */
  label: string;
}

/**
 * Geocoding search parameters
 */
export interface GeoSearchParams {
  /** Search query (city name) */
  query: string;
  /** Limit results to specific country codes */
  countryCode?: string;
  /** Accept-Language header value for localized results */
  language?: string;
  /** Maximum number of results */
  limit?: number;
}

/**
 * Geocoding provider interface
 * Abstraction layer to support different geocoding services
 * (Nominatim, Mapbox, Google Maps, etc.)
 */
export interface GeocodingProvider {
  /** Provider name identifier */
  readonly name: string;
  
  /**
   * Search for places by query
   * @param params Search parameters
   * @returns Array of search results
   */
  search(params: GeoSearchParams): Promise<GeoSearchResult[]>;
  
  /**
   * Get detailed information about a place
   * @param placeId Place identifier from search results
   * @param language Language for localized results
   * @returns Detailed location information or null
   */
  getPlaceDetails?(placeId: string, language?: string): Promise<GeoLocation | null>;
  
  /**
   * Reverse geocode coordinates to address
   * @param lat Latitude
   * @param lon Longitude
   * @param language Language for localized results
   */
  reverseGeocode?(lat: number, lon: number, language?: string): Promise<GeoLocation | null>;
}

// ============================================================
// Nominatim-specific types
// ============================================================

/**
 * Raw Nominatim API response
 */
export interface NominatimSearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: NominatimAddress;
  boundingbox: string[];
}

export interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  suburb?: string;
  district?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
}

// ============================================================
// Cache types
// ============================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheConfig {
  /** Time to live in milliseconds */
  ttlMs: number;
  /** Maximum number of entries */
  maxEntries: number;
}
