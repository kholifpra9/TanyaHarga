'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

type Option = { id: string; name: string };

export function FilterControls({
  markets,
  commodities,
  selectedMarket,
  selectedCommodity,
}: {
  markets: Option[];
  commodities: Option[];
  selectedMarket?: string;
  selectedCommodity?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: 'market' | 'commodity', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Wrap dengan transition agar kita bisa tahu kapan server fetching selesai
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 relative">
      <select
        disabled={isPending}
        className="w-full sm:w-auto bg-white border border-[#E8E1D5] text-[#223326] rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3B6543] shadow-sm cursor-pointer disabled:opacity-60"
        value={selectedMarket ?? ''}
        onChange={(e) => updateFilter('market', e.target.value)}
      >
        <option value="">🛒 Semua Pasar</option>
        {markets.map((m) => (
          <option key={m.id} value={m.name}>{m.name}</option>
        ))}
      </select>

      <select
        disabled={isPending}
        className="w-full sm:w-auto bg-white border border-[#E8E1D5] text-[#223326] rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3B6543] shadow-sm cursor-pointer disabled:opacity-60"
        value={selectedCommodity ?? ''}
        onChange={(e) => updateFilter('commodity', e.target.value)}
      >
        <option value="">🌾 Semua Komoditas</option>
        {commodities.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>

      {/* Spinner Kecil Samping Filter Saat Loading Data */}
      {isPending && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#3B6543] animate-pulse">
          <div className="w-4 h-4 border-2 border-[#E8E1D5] border-t-[#3B6543] rounded-full animate-spin" />
          <span>Memperbarui data...</span>
        </div>
      )}
    </div>
  );
}