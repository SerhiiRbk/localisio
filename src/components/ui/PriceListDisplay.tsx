'use client';

import type { PriceItem } from '@/types/database';

interface PriceListDisplayProps {
  items: PriceItem[];
  title?: string;
}

export function PriceListDisplay({ items, title }: PriceListDisplayProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div>
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <tbody className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <tr key={index} className="bg-white">
                <td className="px-4 py-3 text-slate-900">{item.service}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                  {item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
