'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { serviceCategories, getServiceLabel, getServiceIcon } from '@/config/services';

interface CategorizedServiceSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  locale: string;
  maxItems?: number;
  placeholder?: string;
  error?: string;
}

export function CategorizedServiceSelect({
  label,
  value,
  onChange,
  locale,
  maxItems = 5,
  placeholder,
  error,
}: CategorizedServiceSelectProps) {
  const t = useTranslations('servicesPage.categories');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const toggleService = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter((v) => v !== code));
    } else {
      if (value.length >= maxItems) return;
      onChange([...value, code]);
    }
  };

  const removeService = (code: string) => {
    onChange(value.filter((v) => v !== code));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // When searching, filter categories and auto-expand matching ones
  const searchLower = search.toLowerCase();
  const filteredCategories = serviceCategories
    .map((category) => {
      const matchingServices = category.services.filter((code) => {
        const label = getServiceLabel(code, locale).toLowerCase();
        return label.includes(searchLower);
      });
      return { ...category, filteredServices: matchingServices };
    })
    .filter((c) => c.filteredServices.length > 0);

  const isSearching = search.length > 0;

  // Count selected services per category
  const selectedCountByCategory = serviceCategories.reduce(
    (acc, cat) => {
      acc[cat.id] = cat.services.filter((s) => value.includes(s)).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {/* Selected services pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-200"
            >
              <span>{getServiceIcon(code)}</span>
              <span>{getServiceLabel(code, locale)}</span>
              <button
                type="button"
                onClick={() => removeService(code)}
                className="ml-0.5 text-blue-400 hover:text-blue-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full min-h-[42px] px-3 py-2 text-left rounded-lg border border-gray-300',
            'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
            'bg-white flex items-center justify-between',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        >
          <span className="text-gray-500 text-sm">
            {placeholder || `Select services (${value.length}/${maxItems})`}
          </span>
          <svg
            className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[400px] overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            {/* Categories list */}
            <div className="overflow-auto flex-1">
              {filteredCategories.map((category) => {
                const isExpanded = isSearching || expandedCategories.has(category.id);
                const selectedCount = selectedCountByCategory[category.id] || 0;
                const servicesToShow = isSearching ? category.filteredServices : category.services;

                return (
                  <div key={category.id} className="border-b border-gray-50 last:border-0">
                    {/* Category header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={cn(
                        'w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors',
                        selectedCount > 0 && 'bg-blue-50/50'
                      )}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium text-sm text-gray-800 flex-1 text-left">
                        {t(`${category.id}.title`)}
                      </span>
                      {selectedCount > 0 && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                          {selectedCount}
                        </span>
                      )}
                      <svg
                        className={cn(
                          'w-4 h-4 text-gray-400 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Services within category */}
                    {isExpanded && (
                      <div className="pb-1">
                        {servicesToShow.map((code) => {
                          const isSelected = value.includes(code);
                          const isDisabled = !isSelected && value.length >= maxItems;

                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => toggleService(code)}
                              disabled={isDisabled}
                              className={cn(
                                'w-full px-4 pl-10 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                                isSelected
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50 text-gray-700',
                                isDisabled && 'opacity-40 cursor-not-allowed'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center',
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-gray-300'
                                )}
                              >
                                {isSelected && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <span>{getServiceIcon(code)}</span>
                              <span>{getServiceLabel(code, locale)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No services found
                </div>
              )}
            </div>

            {/* Footer with count */}
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between">
              <span>{value.length} / {maxItems} selected</span>
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-red-500 hover:text-red-700"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
