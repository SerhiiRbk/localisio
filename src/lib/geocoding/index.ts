// ============================================================
// Geocoding Module Exports
// ============================================================

export * from './types';
export { 
  nominatimProvider, 
  getGeocodingProvider,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
} from './nominatim';
export type { GeocodingProviderName } from './nominatim';
