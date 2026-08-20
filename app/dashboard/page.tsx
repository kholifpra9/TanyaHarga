import { supabase } from '@/lib/supabase';
import { getPriceIndicator } from '@/lib/price-indicator';
import { FilterControls } from './filter-controls';

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

  // 1. Ambil daftar market & commodity untuk isi dropdown filter
  const { data: markets } = await supabase.from('markets').select('id, name').order('name');
  const { data: commodities } = await supabase.from('commodities').select('id, name').order('name');

  // 2. Query utama: prices join commodities & markets, dengan filter opsional
  //    "!inner" wajib dipakai supaya bisa filter berdasarkan kolom di tabel relasi (markets.name / commodities.name)
  let query = supabase
    .from('prices')
    .select('id, price, quantity, unit, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
    .order('reported_at', { ascending: false });

  if (market) query = query.eq('markets.name', market);
  if (commodity) query = query.eq('commodities.name', commodity);

  const { data: prices } = await query;

  // 3. Hitung rata-rata price_per_base_unit 7 hari terakhir, per komoditas — untuk indikator warna
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentPrices } = await supabase
    .from('prices')
    .select('price_per_base_unit, commodities!inner(name)')
    .gte('reported_at', sevenDaysAgo.toISOString());

  const groupedByCommodity = new Map<string, number[]>();
  recentPrices?.forEach((row) => {
    const name = (row.commodities as unknown as { name: string })?.name;
    if (!name) return;
    if (!groupedByCommodity.has(name)) groupedByCommodity.set(name, []);
    groupedByCommodity.get(name)!.push(row.price_per_base_unit);
  });

  const averageByCommodity = new Map<string, number>();
  groupedByCommodity.forEach((values, name) => {
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    averageByCommodity.set(name, average);
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Harga</h1>
        <p className="text-sm text-muted-foreground">
          Data harga terbaru dari laporan komunitas.
        </p>
      </div>

      <FilterControls
        markets={markets ?? []}
        commodities={commodities ?? []}
        selectedMarket={market}
        selectedCommodity={commodity}
      />

      {prices && prices.length > 0 ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Komoditas</th>
              <th className="py-2 pr-4">Pasar</th>
              <th className="py-2 pr-4">Harga</th>
              <th className="py-2 pr-4">Satuan</th>
              <th className="py-2 pr-4">Indikator</th>
              <th className="py-2">Dilaporkan</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((row) => {
              const commodityName = (row.commodities as unknown as { name: string })?.name ?? '-';
              const marketName = (row.markets as unknown as { name: string })?.name ?? '-';
              const average = averageByCommodity.get(commodityName);
              const indicator = getPriceIndicator(row.price_per_base_unit, average);

              return (
                <tr key={row.id} className="border-b">
                  <td className="py-2 pr-4">{commodityName}</td>
                  <td className="py-2 pr-4">{marketName}</td>
                  <td className="py-2 pr-4">Rp{row.price.toLocaleString('id-ID')}</td>
                  <td className="py-2 pr-4">{row.quantity} {row.unit}</td>
                  <td className="py-2 pr-4">{indicator.emoji} {indicator.label}</td>
                  <td className="py-2 text-muted-foreground">
                    {new Date(row.reported_at).toLocaleDateString('id-ID')}
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