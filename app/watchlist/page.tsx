import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getPriceIndicator } from '@/lib/price-indicator';
import { aggregateByCommodity } from '@/lib/price-aggregation';
import { WatchlistButton } from '@/app/dashboard/watchlist-button';
import { Navbar } from '@/components/ui/navbar';

type PriceRow = {
  commodity_id: string;
  commodity_name: string;
  market_id: string;
  market_name: string;
  price_per_base_unit: number;
  reported_at: string;
};

export default async function WatchlistPage() {
  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/watchlist');
  }

  const { data: watchlistRows } = await supabaseServer
    .from('watchlist')
    .select('commodity_id, market_id, commodities(name), markets(name)')
    .eq('user_id', user.id);

  const watchItems = (watchlistRows ?? []).map((w) => ({
    commodityId: w.commodity_id as string,
    marketId: w.market_id as string | null,
    commodityName: (w.commodities as unknown as { name: string } | null)?.name ?? '(komoditas dihapus)',
    marketName: (w.markets as unknown as { name: string } | null)?.name ?? null,
  }));

  if (watchItems.length === 0) {
    return (
      <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E8E1D5] p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-[#3B6543]/10 text-[#3B6543] rounded-full flex items-center justify-center mx-auto text-xl">
              📌
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-serif font-bold text-[#223326]">Watchlist Saya</h1>
              <p className="text-sm text-[#5C6E60]">Belum ada komoditas yang kamu pantau saat ini.</p>
            </div>
            <div>
              <Link
                href="/dashboard"
                className="inline-block bg-[#3B6543] text-[#FBF8F3] hover:bg-[#2D4E33] px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Cari Komoditas di Dashboard →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const commodityIds = [...new Set(watchItems.map((w) => w.commodityId))];

  const { data: rawPrices } = await supabase
    .from('prices')
    .select('commodity_id, market_id, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
    .in('commodity_id', commodityIds)
    .order('reported_at', { ascending: false });

  const rows: PriceRow[] = (rawPrices ?? []).map((row) => ({
    commodity_id: row.commodity_id,
    commodity_name: (row.commodities as unknown as { name: string }).name,
    market_id: row.market_id,
    market_name: (row.markets as unknown as { name: string }).name,
    price_per_base_unit: row.price_per_base_unit,
    reported_at: row.reported_at,
  }));

  const aggregatedByCommodity = new Map(
    aggregateByCommodity(rows).map((a) => [a.commodityId, a])
  );

  const latestByCommodityMarket = new Map<string, PriceRow>();
  for (const row of rows) {
    const key = `${row.commodity_id}:${row.market_id}`;
    const existing = latestByCommodityMarket.get(key);
    if (!existing || new Date(row.reported_at) > new Date(existing.reported_at)) {
      latestByCommodityMarket.set(key, row);
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentPrices } = await supabase
    .from('prices')
    .select('price_per_base_unit, commodities!inner(name)')
    .in('commodity_id', commodityIds)
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

  const views = watchItems.map((item) => {
    const average7d = averageByCommodityName.get(item.commodityName);

    if (item.marketId) {
      const latest = latestByCommodityMarket.get(`${item.commodityId}:${item.marketId}`);
      return {
        ...item,
        price: latest?.price_per_base_unit ?? null,
        sourceLabel: item.marketName ?? '—',
        latestReportedAt: latest?.reported_at ?? null,
        indicator: latest ? getPriceIndicator(latest.price_per_base_unit, average7d) : null,
      };
    }

    const aggregate = aggregatedByCommodity.get(item.commodityId);
    return {
      ...item,
      price: aggregate?.averagePrice ?? null,
      sourceLabel: aggregate ? (aggregate.singleMarketName ?? `${aggregate.marketCount} pasar`) : '—',
      latestReportedAt: aggregate?.latestReportedAt ?? null,
      indicator: aggregate ? getPriceIndicator(aggregate.averagePrice, average7d) : null,
    };
  });

  return (
    <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D5] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#223326]">
              Watchlist Saya
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6E60]">
              Memantau {views.length} komoditas favoritmu secara real-time.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B6543] hover:underline bg-[#3B6543]/10 px-3 py-2 rounded-xl self-start sm:self-auto"
          >
            + Tambah Pantauan
          </Link>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-[#E8E1D5] p-4 sm:p-6 shadow-sm">
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1D5] text-xs uppercase font-serif text-[#5C6E60] tracking-wider">
                  <th className="pb-3 pr-4 font-bold">Komoditas</th>
                  <th className="pb-3 pr-4 font-bold">Harga Terbaru</th>
                  <th className="pb-3 pr-4 font-bold">Sumber</th>
                  <th className="pb-3 pr-4 font-bold">Indikator</th>
                  <th className="pb-3 pr-4 font-bold">Diperbarui</th>
                  <th className="pb-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D5]/60">
                {views.map((item) => (
                  <tr key={`${item.commodityId}:${item.marketId ?? 'null'}`} className="hover:bg-[#FBF8F3] transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-[#223326]">{item.commodityName}</td>
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#3B6543]">
                      {item.price != null ? `Rp${Math.round(item.price).toLocaleString('id-ID')}` : '—'}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[#5C6E60]">{item.sourceLabel}</td>
                    <td className="py-3.5 pr-4 text-xs font-medium">
                      {item.indicator ? `${item.indicator.emoji} ${item.indicator.label}` : '—'}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[#5C6E60]">
                      {item.latestReportedAt
                        ? new Date(item.latestReportedAt).toLocaleDateString('id-ID')
                        : 'Belum ada laporan'}
                    </td>
                    <td className="py-3.5 text-right">
                      <WatchlistButton
                        commodityId={item.commodityId}
                        marketId={item.marketId}
                        initialIsWatched={true}
                        isLoggedIn={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden space-y-3">
            {views.map((item) => (
              <div
                key={`${item.commodityId}:${item.marketId ?? 'null'}`}
                className="p-4 rounded-2xl bg-[#FBF8F3] border border-[#E8E1D5] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-[#223326]">{item.commodityName}</h3>
                    <p className="text-xs text-[#5C6E60]">📍 {item.sourceLabel}</p>
                  </div>
                  <WatchlistButton
                    commodityId={item.commodityId}
                    marketId={item.marketId}
                    initialIsWatched={true}
                    isLoggedIn={true}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E1D5]/60 text-xs">
                  <div>
                    <p className="text-[10px] text-[#5C6E60] uppercase tracking-wider font-semibold">Harga Terbaru</p>
                    <p className="font-mono font-bold text-base text-[#3B6543]">
                      {item.price != null ? `Rp${Math.round(item.price).toLocaleString('id-ID')}` : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.indicator ? `${item.indicator.emoji} ${item.indicator.label}` : '—'}</p>
                    <p className="text-[10px] text-[#5C6E60]">
                      {item.latestReportedAt
                        ? new Date(item.latestReportedAt).toLocaleDateString('id-ID')
                        : 'Belum ada laporan'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}