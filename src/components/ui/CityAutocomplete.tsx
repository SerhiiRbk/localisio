'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { GeoSearchResult } from '@/lib/geocoding';

// ============================================================
// Types
// ============================================================

export interface CitySelection {
  /** Stable identifier: osm_type prefix + osm_id (e.g., "R435514" for Praha) */
  place_id: string;
  /** OSM object type: R=relation, W=way, N=node */
  osm_type?: string;
  /** OSM object ID */
  osm_id?: string;
  display_name: string;
  city_name: string;
  country_code: string;
  country_name: string;
  lat: number;
  lon: number;
}

export interface CityAutocompleteProps {
  /** Current selected city */
  value: CitySelection | null;
  /** Callback when city is selected */
  onChange: (city: CitySelection | null) => void;
  /** Filter results by country code (ISO2) */
  countryCode?: string;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names for container */
  className?: string;
  /** Additional class names for input element */
  inputClassName?: string;
  /** Required field */
  required?: boolean;
  /** Hide the selected indicator below input */
  hideSelectedIndicator?: boolean;
}

// ============================================================
// Debounce hook
// ============================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================
// CityAutocomplete Component
// ============================================================

export function CityAutocomplete({
  value,
  onChange,
  countryCode,
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  className,
  inputClassName,
  required = false,
  hideSelectedIndicator = false,
}: CityAutocompleteProps) {
  const locale = useLocale();
  const t = useTranslations('cityAutocomplete');
  
  // State
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Track if user just selected a city (to prevent search trigger)
  const justSelectedRef = useRef(false);
  // Track the last selected place_id to prevent re-searching
  const selectedPlaceIdRef = useRef<string | null>(null);
  
  // Debounced search query
  const debouncedQuery = useDebounce(inputValue, 300);
  
  // Sync input value with selected city (only when value changes externally)
  useEffect(() => {
    if (value) {
      // Only update if place_id changed (external change) or initial load
      if (selectedPlaceIdRef.current !== value.place_id) {
        setInputValue(value.city_name);
        selectedPlaceIdRef.current = value.place_id;
      }
    } else {
      setInputValue('');
      selectedPlaceIdRef.current = null;
    }
  }, [value]);
  
  // Search effect
  useEffect(() => {
    const searchCities = async () => {
      // Skip search if we just selected a city
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      
      if (debouncedQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      
      // Don't search if input matches current selection
      if (value && debouncedQuery.toLowerCase() === value.city_name.toLowerCase()) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      
      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          lang: locale,
          limit: '10',
        });
        
        if (countryCode) {
          params.set('country', countryCode);
        }
        
        const response = await fetch(`/api/geocode?${params.toString()}`);
        
        if (!response.ok) {
          if (response.status === 429) {
            setErrorMessage(t('rateLimitError'));
          } else {
            setErrorMessage(t('searchError'));
          }
          setResults([]);
          return;
        }
        
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(data.results?.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('City search error:', err);
        setErrorMessage(t('searchError'));
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    searchCities();
  }, [debouncedQuery, countryCode, locale, value, t]);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to selected value if user clicked away without selecting
        if (value) {
          setInputValue(value.city_name);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);
  
  // Handle city selection
  const handleSelect = useCallback((city: GeoSearchResult) => {
    const selection: CitySelection = {
      place_id: city.place_id,
      osm_type: city.osm_type,
      osm_id: city.osm_id,
      display_name: city.display_name,
      city_name: city.city_name,
      country_code: city.country_code,
      country_name: city.country_name,
      lat: city.lat,
      lon: city.lon,
    };
    
    // Mark that we just selected to prevent re-search
    justSelectedRef.current = true;
    selectedPlaceIdRef.current = city.place_id;
    
    onChange(selection);
    setInputValue(city.city_name);
    setIsOpen(false);
    setResults([]);
  }, [onChange]);
  
  // Handle clear
  const handleClear = useCallback(() => {
    selectedPlaceIdRef.current = null;
    onChange(null);
    setInputValue('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        event.preventDefault();
      }
      return;
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        if (value) {
          setInputValue(value.city_name);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [isOpen, results, highlightedIndex, handleSelect, value]);
  
  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);
  
  const displayError = error || errorMessage;
  
  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (value && e.target.value !== value.city_name) {
              onChange(null); // Clear selection when typing new value
            }
          }}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('placeholder')}
          disabled={disabled}
          className={cn(
            'block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-900 placeholder-gray-500',
            'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            displayError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            inputClassName
          )}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="city-listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `city-option-${highlightedIndex}` : undefined
          }
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}
        
        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label={t('clear')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Dropdown icon when no value */}
        {!value && !isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Dropdown list */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id="city-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-auto"
        >
          {results.map((city, index) => (
            <li
              key={city.place_id}
              id={`city-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              className={cn(
                'px-3 py-2 cursor-pointer flex items-center gap-2',
                highlightedIndex === index
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              )}
              onClick={() => handleSelect(city)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {/* Country flag placeholder - could use flag emoji or icon */}
              <span className="text-sm text-gray-400 w-6">
                {city.country_code}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {city.city_name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {city.country_name}
                </div>
              </div>
              <span className="text-xs text-gray-400 capitalize">
                {city.place_type}
              </span>
            </li>
          ))}
        </ul>
      )}
      
      {/* No results message */}
      {isOpen && debouncedQuery.length >= 2 && results.length === 0 && !isLoading && !errorMessage && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg p-3 text-sm text-gray-500">
          {t('noResults')}
        </div>
      )}
      
      {/* Error message */}
      {displayError && (
        <p className="mt-1 text-sm text-red-600">{displayError}</p>
      )}
      
      {/* Helper text */}
      {helperText && !displayError && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      
      {/* Selected value indicator */}
      {value && !hideSelectedIndicator && (
        <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>{t('selected', { city: value.city_name, country: value.country_name })}</span>
        </div>
      )}
    </div>
  );
}

export default CityAutocomplete;
