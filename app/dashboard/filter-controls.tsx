'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

type Option = { id: string; name: string };

export function FilterControls({
  markets,
  categories,
  selectedMarket,
  selectedCategory,
}: {
  markets: Option[];
  categories: string[];
  selectedMarket?: string;
  selectedCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: 'market' | 'category', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 relative">
      {/* Filter Pasar */}
      <select
        disabled={isPending}
        className="w-full sm:w-auto bg-white border border-border-soft text-text-main rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-market shadow-sm cursor-pointer disabled:opacity-60 transition-colors"
        value={selectedMarket ?? ''}
        onChange={(e) => updateFilter('market', e.target.value)}
      >
        <option value="">🛒 Semua Pasar</option>
        {markets.map((m) => (
          <option key={m.id} value={m.name}>{m.name}</option>
        ))}
      </select>

      {/* Filter Kategori */}
      <select
        disabled={isPending}
        className="w-full sm:w-auto bg-white border border-border-soft text-text-main rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary-market shadow-sm cursor-pointer disabled:opacity-60 capitalize transition-colors"
        value={selectedCategory ?? ''}
        onChange={(e) => updateFilter('category', e.target.value)}
      >
        <option value="">🏷️ Semua Kategori</option>
        {categories.map((cat) => (
          <option key={cat} value={cat} className="capitalize">
            {cat}
          </option>
        ))}
      </select>

      {/* Indicator Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-xs font-semibold text-primary-market animate-pulse">
          <div className="w-4 h-4 border-2 border-border-soft border-t-primary-market rounded-full animate-spin" />
          <span>Memperbarui data...</span>
        </div>
      )}
    </div>
  );
}