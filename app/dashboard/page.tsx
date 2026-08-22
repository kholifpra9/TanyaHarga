import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getPriceIndicator } from '@/lib/price-indicator';
import { aggregateByCommodity } from '@/lib/price-aggregation'; // 🆕 BARU
import { FilterControls } from './filter-controls';
import { WatchlistButton } from './watchlist-button';

type DashboardSearchParams = {
  market?: string;
  commodity?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const { market, commodity } = await searchParams;

  // Cek siapa yang login, lalu ambil watchlist user itu.
  // Key-nya sekarang gabungan commodity_id + market_id (bukan cuma commodity_id)
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
  const { data: commodities } = await supabase.from('commodities').select('id, name').order('name');

  // Query prices MENTAH — tidak lagi langsung ditampilkan per baris, tapi diagregasi
  // dulu lewat aggregateByCommodity() di bawah
  let query = supabase
    .from('prices')
    .select('commodity_id, market_id, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
    .order('reported_at', { ascending: false });

  if (market) query = query.eq('markets.name', market);
  if (commodity) query = query.eq('commodities.name', commodity);

  const { data: rawPrices } = await query;

  const rows = (rawPrices ?? []).map((row) => ({
    commodity_id: row.commodity_id,
    commodity_name: (row.commodities as unknown as { name: string }).name,
    market_id: row.market_id,
    market_name: (row.markets as unknown as { name: string }).name,
    price_per_base_unit: row.price_per_base_unit,
    reported_at: row.reported_at,
  }));

  const aggregated = aggregateByCommodity(rows);

  // Rata-rata 7 hari terakhir per NAMA komoditas — baseline untuk indikator warna.
  // Logic ini TIDAK BERUBAH dari Epic 4, cuma sekarang dipakai per hasil agregasi, bukan per baris laporan
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

  // market_id yang sedang difilter (kalau ada) — dipakai untuk watchlist per pasar
  const selectedMarketId = market ? markets?.find((m) => m.name === market)?.id ?? null : null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Harga</h1>
        <p className="text-sm text-muted-foreground">
          {market ? `Rata-rata harga terbaru di ${market}.` : 'Rata-rata harga terbaru dari seluruh pasar.'}
        </p>
      </div>

      <FilterControls
        markets={markets ?? []}
        commodities={commodities ?? []}
        selectedMarket={market}
        selectedCommodity={commodity}
      />

      {aggregated.length > 0 ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Komoditas</th>
              <th className="py-2 pr-4">Harga Rata-rata</th>
              <th className="py-2 pr-4">Sumber</th>
              <th className="py-2 pr-4">Indikator</th>
              <th className="py-2 pr-4">Diperbarui</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {aggregated.map((item) => {
              const average7d = averageByCommodityName.get(item.commodityName);
              const indicator = getPriceIndicator(item.averagePrice, average7d);
              const watchKey = `${item.commodityId}:${selectedMarketId ?? 'null'}`;

              return (
                <tr key={item.commodityId} className="border-b">
                  <td className="py-2 pr-4">{item.commodityName}</td>
                  <td className="py-2 pr-4">Rp{Math.round(item.averagePrice).toLocaleString('id-ID')}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {item.singleMarketName ?? `${item.marketCount} pasar`}
                  </td>
                  <td className="py-2 pr-4">{indicator.emoji} {indicator.label}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {new Date(item.latestReportedAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-2">
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
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada data harga untuk filter ini.</p>
      )}
    </div>
  );
}