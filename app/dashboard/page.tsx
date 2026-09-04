import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getPriceIndicator } from '@/lib/price-indicator';
import { aggregateByCommodity } from '@/lib/price-aggregation';
import { getPaginationMeta } from '@/lib/pagination'; // <--- Import Helper Pagination
import { Navbar } from '@/components/layout/navbar';
import { PaginationControls } from '@/components/ui/pagination-controls'; // <--- Import Reusable Component
import { FilterControls } from './filter-controls';
import { WatchlistButton } from './watchlist-button';

type DashboardSearchParams = {
  market?: string;
  category?: string;
  page?: string;
};

const ITEMS_PER_PAGE = 8;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const { market, category, page } = await searchParams;

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  let watchedKeys = new Set<string>();
  if (user) {
    const { data: watchlistRows } = await supabaseServer
      .from('watchlist')
      .select('commodity_id, market_id')
      .eq('user_id', user.id);
    watchedKeys = new Set(watchlistRows?.map((w) => `${w.commodity_id}:${w.market_id ?? 'null'}`) ?? []);
  }

  const { data: markets } = await supabase.from('markets').select('id, name').order('name');
  
  const { data: rawCommodities } = await supabase.from('commodities').select('category').order('category');
  const categories = Array.from(new Set(rawCommodities?.map((c) => c.category).filter(Boolean))) as string[];

  let query = supabase
    .from('prices')
    .select('commodity_id, market_id, price_per_base_unit, quantity, unit, reported_at, commodities!inner(name, base_unit, category), markets!inner(name)')
    .order('reported_at', { ascending: false });

  if (market) query = query.eq('markets.name', market);
  if (category) query = query.eq('commodities.category', category);

  const { data: rawPrices } = await query;

  const rows = (rawPrices ?? []).map((row) => {
    const commodityData = row.commodities as unknown as { name: string; base_unit: string; category: string };
    return {
      commodity_id: row.commodity_id,
      commodity_name: commodityData.name,
      base_unit: commodityData.base_unit ?? row.unit ?? 'kg',
      market_id: row.market_id,
      market_name: (row.markets as unknown as { name: string }).name,
      price_per_base_unit: row.price_per_base_unit,
      quantity: row.quantity,
      unit: row.unit,
      reported_at: row.reported_at,
    };
  });

  // Agregasi Data
  const aggregated = aggregateByCommodity(rows);

  // INTEGRASI LIB PAGINATION
  const pagination = getPaginationMeta(page, aggregated.length, ITEMS_PER_PAGE);
  const paginatedItems = aggregated.slice(pagination.startIndex, pagination.endIndex);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentPrices } = await supabase
    .from('prices')
    .select('price_per_base_unit, commodities!inner(name)')
    .gte('reported_at', sevenDaysAgo.toISOString());

  const groupedByCommodityName = new Map<string, number[]>();
  recentPrices?.forEach((row) => {
    const name = (row.commodities as unknown as { name: string })?.name;
    if (!name) return;
    if (!groupedByCommodityName.has(name)) groupedByCommodityName.set(name, []);
    groupedByCommodityName.get(name)!.push(row.price_per_base_unit);
  });

  const averageByCommodityName = new Map<string, number>();
  groupedByCommodityName.forEach((values, name) => {
    averageByCommodityName.set(name, values.reduce((sum, v) => sum + v, 0) / values.length);
  });

  const selectedMarketId = market ? markets?.find((m) => m.name === market)?.id ?? null : null;

  return (
    <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#223326]">
            Dashboard Harga Pasar
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6E60]">
            {market ? `Rata-rata harga terbaru di ${market}.` : 'Rata-rata harga terbaru dari seluruh pasar.'}
          </p>
        </div>

        <Suspense fallback={<div className="h-10 bg-[#E8E1D5]/40 rounded-xl animate-pulse" />}>
          <FilterControls
            markets={markets ?? []}
            categories={categories}
            selectedMarket={market}
            selectedCategory={category}
          />
        </Suspense>

        <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-sm overflow-hidden p-4 sm:p-6">
          {paginatedItems.length > 0 ? (
            <>
              {/* TAMPILAN DESKTOP */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E1D5] text-xs uppercase font-serif text-[#5C6E60] tracking-wider">
                      <th className="pb-3 pr-4 font-bold">Komoditas</th>
                      <th className="pb-3 pr-4 font-bold">Harga Rata-rata</th>
                      <th className="pb-3 pr-4 font-bold">Sumber Pasar</th>
                      <th className="pb-3 pr-4 font-bold">Indikator</th>
                      <th className="pb-3 pr-4 font-bold">Diperbarui</th>
                      <th className="pb-3 text-right font-bold">Watchlist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D5]/60">
                    {paginatedItems.map((item) => {
                      const average7d = averageByCommodityName.get(item.commodityName);
                      const indicator = getPriceIndicator(item.averagePrice, average7d);
                      const watchKey = `${item.commodityId}:${selectedMarketId ?? 'null'}`;

                      return (
                        <tr key={item.commodityId} className="hover:bg-[#FBF8F3] transition-colors">
                          <td className="py-3.5 pr-4 font-semibold text-[#223326]">{item.commodityName}</td>
                          <td className="py-3.5 pr-4 font-mono font-bold text-[#3B6543]">
                            Rp{Math.round(item.averagePrice).toLocaleString('id-ID')}
                            <span className="text-xs font-normal text-[#5C6E60]"> / {item.baseUnit ?? 'kg'}</span>
                          </td>
                          <td className="py-3.5 pr-4 text-xs text-[#5C6E60]">
                            {item.singleMarketName ?? `${item.marketCount} pasar`}
                          </td>
                          <td className="py-3.5 pr-4 text-xs font-medium">
                            {indicator.emoji} {indicator.label}
                          </td>
                          <td className="py-3.5 pr-4 text-xs text-[#5C6E60]">
                            {new Date(item.latestReportedAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3.5 text-right">
                            <WatchlistButton
                              commodityId={item.commodityId}
                              marketId={selectedMarketId}
                              initialIsWatched={watchedKeys.has(watchKey)}
                              isLoggedIn={!!user}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* TAMPILAN MOBILE */}
              <div className="md:hidden space-y-3">
                {paginatedItems.map((item) => {
                  const average7d = averageByCommodityName.get(item.commodityName);
                  const indicator = getPriceIndicator(item.averagePrice, average7d);
                  const watchKey = `${item.commodityId}:${selectedMarketId ?? 'null'}`;

                  return (
                    <div
                      key={item.commodityId}
                      className="p-4 rounded-2xl bg-[#FBF8F3] border border-[#E8E1D5] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base text-[#223326]">{item.commodityName}</h3>
                          <p className="text-xs text-[#5C6E60]">
                            📍 {item.singleMarketName ?? `${item.marketCount} pasar`}
                          </p>
                        </div>
                        <WatchlistButton
                          commodityId={item.commodityId}
                          marketId={selectedMarketId}
                          initialIsWatched={watchedKeys.has(watchKey)}
                          isLoggedIn={!!user}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E8E1D5]/60">
                        <div>
                          <p className="text-[10px] text-[#5C6E60] uppercase tracking-wider font-semibold">Harga Rata-rata</p>
                          <p className="font-mono font-bold text-base text-[#3B6543]">
                            Rp{Math.round(item.averagePrice).toLocaleString('id-ID')}
                            <span className="text-xs font-normal text-[#5C6E60]"> / {item.baseUnit ?? 'kg'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">{indicator.emoji} {indicator.label}</p>
                          <p className="text-[10px] text-[#5C6E60]">
                            {new Date(item.latestReportedAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MENGGUNAKAN INFORMASI DARI LIB/PAGINATION */}
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
              />
            </>
          ) : (
            <div className="py-12 text-center text-xs sm:text-sm text-[#5C6E60]">
              Belum ada data harga untuk kombinasi filter ini.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}