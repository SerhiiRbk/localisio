'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ServiceTaxonomy, ServiceType, ServiceCategoryWithTypes } from '@/types/services';

// ============================================================
// Types
// ============================================================

interface ServiceTypeSelectProps {
  /** Current selected value(s) - ID or array of IDs */
  value: string | string[] | null;
  /** Change handler */
  onChange: (value: string | string[] | null) => void;
  /** Enable multi-select mode */
  multiple?: boolean;
  /** Label for the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Custom class name */
  className?: string;
  /** Custom input class name */
  inputClassName?: string;
  /** Show clear button */
  showClear?: boolean;
  /** Maximum selections (for multi-select) */
  maxSelections?: number;
}

// ============================================================
// Component
// ============================================================

export function ServiceTypeSelect({
  value,
  onChange,
  multiple = false,
  label,
  placeholder,
  disabled = false,
  error,
  className,
  inputClassName,
  showClear = true,
  maxSelections = 10,
}: ServiceTypeSelectProps) {
  const locale = useLocale();
  const t = useTranslations('serviceSelect');
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [taxonomy, setTaxonomy] = useState<ServiceTaxonomy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Expand all categories when dropdown opens or when searching
  useEffect(() => {
    if (isOpen && taxonomy) {
      // Expand all categories by default when opening (including "popular" section)
      setExpandedCategories(new Set(['popular', ...taxonomy.categories.map(c => c.id)]));
    }
  }, [isOpen, taxonomy]);

  // Fetch taxonomy on mount
  useEffect(() => {
    async function fetchTaxonomy() {
      try {
        const res = await fetch(`/api/services/taxonomy?locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          setTaxonomy(data);
        }
      } catch (err) {
        console.error('Failed to fetch service taxonomy:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTaxonomy();
  }, [locale]);

  // Get selected services
  const selectedServices = useMemo(() => {
    if (!taxonomy || !value) return [];
    const ids = Array.isArray(value) ? value : [value];
    return taxonomy.allTypes.filter(t => ids.includes(t.id));
  }, [taxonomy, value]);

  // Filter services based on search query
  const filteredResults = useMemo(() => {
    if (!taxonomy) return { popular: [], categories: [] };
    
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      return {
        popular: taxonomy.popularTypes,
        categories: taxonomy.categories,
      };
    }

    // Filter types by search query
    const matchingTypes = taxonomy.allTypes.filter(type =>
      type.title.toLowerCase().includes(query) ||
      type.slug.toLowerCase().includes(query)
    );

    // Group filtered types by category
    const filteredCategories: ServiceCategoryWithTypes[] = [];
    for (const cat of taxonomy.categories) {
      const typesInCategory = matchingTypes.filter(t => t.category_id === cat.id);
      if (typesInCategory.length > 0) {
        filteredCategories.push({
          ...cat,
          types: typesInCategory,
        });
      }
    }

    return {
      popular: [], // Hide popular section when searching
      categories: filteredCategories,
    };
  }, [taxonomy, searchQuery]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const items: ServiceType[] = [];
    for (const type of filteredResults.popular) {
      if (!items.find(i => i.id === type.id)) {
        items.push(type);
      }
    }
    for (const cat of filteredResults.categories) {
      for (const type of cat.types) {
        if (!items.find(i => i.id === type.id)) {
          items.push(type);
        }
      }
    }
    return items;
  }, [filteredResults]);

  // Handle selection
  const handleSelect = useCallback((type: ServiceType) => {
    if (multiple) {
      const currentIds = Array.isArray(value) ? value : value ? [value] : [];
      if (currentIds.includes(type.id)) {
        // Remove
        const newIds = currentIds.filter(id => id !== type.id);
        onChange(newIds.length > 0 ? newIds : null);
      } else if (currentIds.length < maxSelections) {
        // Add
        onChange([...currentIds, type.id]);
      }
    } else {
      onChange(type.id);
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [multiple, value, onChange, maxSelections]);

  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
    if (!multiple) {
      setIsOpen(false);
    }
  }, [onChange, multiple]);

  // Handle chip removal
  const handleRemoveChip = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (Array.isArray(value)) {
      const newIds = value.filter(v => v !== id);
      onChange(newIds.length > 0 ? newIds : null);
    } else {
      onChange(null);
    }
  }, [value, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < flatList.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : flatList.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && flatList[highlightedIndex]) {
          handleSelect(flatList[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, flatList, highlightedIndex, handleSelect]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-service-item]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 text-inherit">{part}</mark>
        : part
    );
  };

  // Check if type is selected
  const isSelected = (typeId: string) => {
    if (Array.isArray(value)) return value.includes(typeId);
    return value === typeId;
  };

  const hasValue = multiple 
    ? Array.isArray(value) && value.length > 0
    : !!value;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Input / Trigger */}
      <div
        className={cn(
          'relative w-full cursor-pointer transition-all flex items-center',
          // Default styling (matches Select component)
          !inputClassName && 'rounded-lg border border-gray-300 bg-white px-3 py-2',
          !inputClassName && 'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500',
          !inputClassName && isOpen && 'border-blue-500 ring-1 ring-blue-500',
          !inputClassName && !error && !isOpen && 'hover:border-gray-400',
          // Custom styling (when inputClassName is provided)
          inputClassName,
          inputClassName && isOpen && 'bg-white',
          // Error and disabled states
          error && '!border-red-500 focus-within:!ring-red-500',
          disabled && '!bg-gray-100 cursor-not-allowed opacity-60',
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <div className="flex flex-wrap items-center gap-1.5 pr-8 flex-1 min-h-[24px] overflow-hidden">
          {/* Multi-select chips */}
          {multiple && selectedServices.map(service => (
            <span
              key={service.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-sm flex-shrink-0"
            >
              <span>{service.icon}</span>
              <span className="truncate max-w-[150px]">{service.title}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveChip(service.id, e)}
                className="ml-0.5 hover:text-blue-600 flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          {/* Single select: show selected value with truncation */}
          {!multiple && hasValue && !searchQuery && selectedServices[0] && (
            <span className="flex items-center gap-1.5 text-gray-900 truncate flex-1 min-w-0">
              
              <span className="truncate px-1">{selectedServices[0].title}</span>
            </span>
          )}

          {/* Search input - hidden when single value is shown, visible when typing */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(-1);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={!hasValue || multiple ? (placeholder || t('placeholder')) : ''}
            disabled={disabled}
            className={cn(
              'outline-none bg-transparent text-gray-900 placeholder-gray-900 px-2',
              // Hide input when single value is displayed (but keep it for typing)
              !multiple && hasValue && !searchQuery ? 'w-0 min-w-0' : 'flex-1 min-w-[80px]'
            )}
          />
        </div>

        {/* Clear button */}
        {showClear && hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg 
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform',
              isOpen && 'rotate-180'
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={listRef}
          className="absolute z-[9999] mt-1 w-full min-w-[360px] max-h-[400px] overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              {t('loading')}
            </div>
          ) : flatList.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {t('noResults')}
            </div>
          ) : (
            <>
              {/* Popular section */}
              {filteredResults.popular.length > 0 && (() => {
                const isPopularExpanded = expandedCategories.has('popular');
                return (
                  <div className="border-b border-gray-100">
                    {/* Popular header - clickable to toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleCategory('popular', e)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className={cn(
                          'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
                          isPopularExpanded && 'rotate-90'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-lg">⭐</span>
                      <span className="text-sm font-semibold text-gray-700">{t('popular')}</span>
                      <span className="text-xs text-gray-400 ml-auto">{filteredResults.popular.length}</span>
                    </button>
                    
                    {/* Popular items - collapsible */}
                    {isPopularExpanded && (
                      <div className="pb-1">
                        {filteredResults.popular.map((type, idx) => (
                          <ServiceItem
                            key={type.id}
                            type={type}
                            isSelected={isSelected(type.id)}
                            isHighlighted={highlightedIndex === idx}
                            searchQuery={searchQuery}
                            onClick={() => handleSelect(type)}
                            highlightMatch={highlightMatch}
                            indented={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Categories */}
              {filteredResults.categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                return (
                  <div key={category.id} className="border-t border-gray-100 first:border-t-0">
                    {/* Category header - clickable to toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleCategory(category.id, e)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className={cn(
                          'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
                          isExpanded && 'rotate-90'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-semibold text-gray-700">{category.title}</span>
                      <span className="text-xs text-gray-400 ml-auto">{category.types.length}</span>
                    </button>
                    
                    {/* Category items - collapsible */}
                    {isExpanded && (
                      <div className="pb-1">
                        {category.types.map((type) => {
                          const flatIndex = flatList.findIndex(t => t.id === type.id);
                          return (
                            <ServiceItem
                              key={type.id}
                              type={type}
                              isSelected={isSelected(type.id)}
                              isHighlighted={highlightedIndex === flatIndex}
                              searchQuery={searchQuery}
                              onClick={() => handleSelect(type)}
                              highlightMatch={highlightMatch}
                              indented={true}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Service Item Component
// ============================================================

interface ServiceItemProps {
  type: ServiceType;
  isSelected: boolean;
  isHighlighted: boolean;
  searchQuery: string;
  onClick: () => void;
  highlightMatch: (text: string, query: string) => React.ReactNode;
  indented?: boolean;
}

function ServiceItem({
  type,
  isSelected,
  isHighlighted,
  searchQuery,
  onClick,
  highlightMatch,
  indented = false,
}: ServiceItemProps) {
  return (
    <button
      type="button"
      data-service-item
      onClick={onClick}
      className={cn(
        'w-full py-2 rounded-lg text-left flex items-center gap-2 transition-colors',
        indented ? 'pl-12 pr-3' : 'px-3',
        isHighlighted && 'bg-blue-50',
        isSelected && 'bg-blue-100 text-blue-900',
        !isHighlighted && !isSelected && 'hover:bg-gray-50'
      )}
    >
      <span className="flex-shrink-0">{type.icon}</span>
      <span className="flex-1 text-sm">
        {highlightMatch(type.title, searchQuery)}
      </span>
      {isSelected && (
        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

// ============================================================
// Export helper hook
// ============================================================

export function useServiceTaxonomy() {
  const locale = useLocale();
  const [taxonomy, setTaxonomy] = useState<ServiceTaxonomy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTaxonomy() {
      try {
        const res = await fetch(`/api/services/taxonomy?locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          setTaxonomy(data);
        }
      } catch (err) {
        console.error('Failed to fetch service taxonomy:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTaxonomy();
  }, [locale]);

  return { taxonomy, isLoading };
}
