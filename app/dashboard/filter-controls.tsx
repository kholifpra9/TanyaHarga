'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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

  function updateFilter(key: 'market' | 'commodity', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        className="w-full sm:w-auto bg-white border border-[#E8E1D5] text-[#223326] rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3B6543] shadow-sm cursor-pointer"
        value={selectedMarket ?? ''}
        onChange={(e) => updateFilter('market', e.target.value)}
      >
        <option value="">🛒 Semua Pasar</option>
        {markets.map((m) => (
          <option key={m.id} value={m.name}>{m.name}</option>
        ))}
      </select>

      <select
        className="w-full sm:w-auto bg-white border border-[#E8E1D5] text-[#223326] rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#3B6543] shadow-sm cursor-pointer"
        value={selectedCommodity ?? ''}
        onChange={(e) => updateFilter('commodity', e.target.value)}
      >
        <option value="">🌾 Semua Komoditas</option>
        {commodities.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}