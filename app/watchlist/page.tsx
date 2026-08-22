import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getPriceIndicator } from '@/lib/price-indicator';
import { aggregateByCommodity } from '@/lib/price-aggregation';
import { WatchlistButton } from '@/app/dashboard/watchlist-button';

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

  // Watchlist itu data privat milik user, jadi wajib login — sama seperti /report-price/history
  if (!user) {
    redirect('/login?redirectTo=/watchlist');
  }

  // 1. Ambil watchlist milik user ini. market_id bisa null (artinya "pantau di semua pasar"),
  //    makanya join ke markets TIDAK pakai !inner (biar row dengan market_id null tetap ikut)
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
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Watchlist Saya</h1>
          <p className="text-sm text-muted-foreground">Belum ada komoditas yang kamu pantau.</p>
        </div>
        <a href="/dashboard" className="underline text-sm">
          Cari komoditas di dashboard untuk mulai memantau →
        </a>
      </div>
    );
  }

  const commodityIds = [...new Set(watchItems.map((w) => w.commodityId))];

  // 2. Ambil semua harga (lintas pasar) untuk komoditas yang di-watch —
  //    dipakai baik untuk item watchlist per-pasar maupun item "semua pasar".
  //    Sama seperti dashboard, ini data publik jadi pakai anon client.
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

  // Agregat rata-rata lintas pasar per komoditas — untuk item watchlist "semua pasar" (market_id null)
  const aggregatedByCommodity = new Map(
    aggregateByCommodity(rows).map((a) => [a.commodityId, a])
  );

  // Laporan terbaru per kombinasi commodity+market — untuk item watchlist yang spesifik ke 1 pasar
  const latestByCommodityMarket = new Map<string, PriceRow>();
  for (const row of rows) {
    const key = `${row.commodity_id}:${row.market_id}`;
    const existing = latestByCommodityMarket.get(key);
    if (!existing || new Date(row.reported_at) > new Date(existing.reported_at)) {
      latestByCommodityMarket.set(key, row);
    }
  }

  // Rata-rata 7 hari terakhir per NAMA komoditas — baseline indikator warna, sama seperti dashboard
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

  // 3. Gabungkan tiap item watchlist dengan harga terbarunya
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
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Watchlist Saya</h1>
        <p className="text-sm text-muted-foreground">{views.length} komoditas dipantau.</p>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Komoditas</th>
            <th className="py-2 pr-4">Harga Terbaru</th>
            <th className="py-2 pr-4">Sumber</th>
            <th className="py-2 pr-4">Indikator</th>
            <th className="py-2 pr-4">Diperbarui</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {views.map((item) => (
            <tr key={`${item.commodityId}:${item.marketId ?? 'null'}`} className="border-b">
              <td className="py-2 pr-4">{item.commodityName}</td>
              <td className="py-2 pr-4">
                {item.price != null ? `Rp${Math.round(item.price).toLocaleString('id-ID')}` : '—'}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">{item.sourceLabel}</td>
              <td className="py-2 pr-4">
                {item.indicator ? `${item.indicator.emoji} ${item.indicator.label}` : '—'}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {item.latestReportedAt
                  ? new Date(item.latestReportedAt).toLocaleDateString('id-ID')
                  : 'Belum ada laporan'}
              </td>
              <td className="py-2">
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
  );
}