'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FAQItem } from '@/types/database';

interface FAQDisplayProps {
  items: FAQItem[];
  title?: string;
}

export function FAQDisplay({ items, title }: FAQDisplayProps) {
  const t = useTranslations('faq.display');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
        {items.map((item, index) => (
          <div key={index} className="bg-white">
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="w-full px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium text-slate-900">{item.question}</span>
              <svg
                className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                  expandedIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expandedIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="px-4 pb-4 pt-0 text-slate-700 whitespace-pre-wrap">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
