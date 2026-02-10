'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from './Input';
import { Button } from './Button';
import type { PriceItem } from '@/types/database';

const MAX_ITEMS = 5;

interface PriceListEditorProps {
  value: PriceItem[];
  onChange: (items: PriceItem[]) => void;
  error?: string;
}

export function PriceListEditor({ value, onChange, error }: PriceListEditorProps) {
  const t = useTranslations('priceList.editor');
  const [localItems, setLocalItems] = useState<PriceItem[]>(value);

  useEffect(() => {
    setLocalItems(value);
  }, [value]);

  const canAddMore = localItems.length < MAX_ITEMS;

  const handleAddItem = () => {
    if (!canAddMore) return;
    const newItems = [...localItems, { service: '', price: '' }];
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = localItems.filter((_, i) => i !== index);
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleUpdateItem = (index: number, field: 'service' | 'price', val: string) => {
    const newItems = [...localItems];
    newItems[index] = { ...newItems[index], [field]: val };
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...localItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === localItems.length - 1) return;
    const newItems = [...localItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setLocalItems(newItems);
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">{t('description')}</p>
        <span className="text-sm text-slate-500">
          {localItems.length}/{MAX_ITEMS}
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {localItems.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-500 mb-4">{t('empty')}</p>
          <Button type="button" variant="outline" onClick={handleAddItem}>
            {t('addFirst')}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {localItems.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">
                {t('itemNumber', { number: index + 1 })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  title={t('moveUp')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === localItems.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  title={t('moveDown')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1 text-red-400 hover:text-red-600 ml-2"
                  title={t('remove')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('service')}
                placeholder={t('servicePlaceholder')}
                value={item.service}
                onChange={(e) => handleUpdateItem(index, 'service', e.target.value)}
                maxLength={100}
              />
              <Input
                label={t('price')}
                placeholder={t('pricePlaceholder')}
                value={item.price}
                onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                maxLength={50}
              />
            </div>
          </div>
        ))}
      </div>

      {localItems.length > 0 && canAddMore && (
        <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
          {t('addMore')}
        </Button>
      )}
    </div>
  );
}
