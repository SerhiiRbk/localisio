'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  maxItems?: number;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select...',
  error,
  maxItems,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (maxItems && value.length >= maxItems) return;
      onChange([...value, optionValue]);
    }
  };

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full min-h-[42px] px-3 py-2 text-left rounded-lg border border-gray-300',
            'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
            'bg-white',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
        >
          {selectedLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedLabels.map((label, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </button>
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2',
                  value.includes(option.value) && 'bg-blue-50'
                )}
                disabled={maxItems !== undefined && !value.includes(option.value) && value.length >= maxItems}
              >
                <span
                  className={cn(
                    'w-4 h-4 border rounded flex items-center justify-center',
                    value.includes(option.value)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300'
                  )}
                >
                  {value.includes(option.value) && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
