import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { aggregateByCommodity } from '@/lib/price-aggregation';
import { getPriceIndicator } from '@/lib/price-indicator';
import { formatRupiah, formatTimeAgo } from '@/lib/utils';

const TICKER_SIZE = 5;

async function getTodaysPriceBoard() {
  const { data: rawPrices } = await supabase
    .from('prices')
    .select('commodity_id, market_id, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
    .order('reported_at', { ascending: false })
    .limit(200);

  const rows = (rawPrices ?? []).map((row) => ({
    commodity_id: row.commodity_id,
    commodity_name: (row.commodities as unknown as { name: string }).name,
    market_id: row.market_id,
    market_name: (row.markets as unknown as { name: string }).name,
    price_per_base_unit: row.price_per_base_unit,
    reported_at: row.reported_at,
  }));

  if (rows.length === 0) return [];

  const aggregated = aggregateByCommodity(rows)
    .sort((a, b) => new Date(b.latestReportedAt).getTime() - new Date(a.latestReportedAt).getTime())
    .slice(0, TICKER_SIZE);

  const topCommodityIds = aggregated.map((a) => a.commodityId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentPrices } = await supabase
    .from('prices')
    .select('price_per_base_unit, commodities!inner(name)')
    .in('commodity_id', topCommodityIds)
    .gte('reported_at', sevenDaysAgo.toISOString());

  const averageByCommodityName = new Map<string, number>();
  const groupedByCommodityName = new Map<string, number[]>();
  recentPrices?.forEach((row) => {
    const name = (row.commodities as unknown as { name: string })?.name;
    if (!name) return;
    if (!groupedByCommodityName.has(name)) groupedByCommodityName.set(name, []);
    groupedByCommodityName.get(name)!.push(row.price_per_base_unit);
  });
  groupedByCommodityName.forEach((values, name) => {
    averageByCommodityName.set(name, values.reduce((sum, v) => sum + v, 0) / values.length);
  });

  return aggregated.map((item) => ({
    ...item,
    indicator: getPriceIndicator(item.averagePrice, averageByCommodityName.get(item.commodityName)),
  }));
}

export default async function LandingPage() {
  const priceBoard = await getTodaysPriceBoard();

  return (
    <div className="bg-[#FAF3E4] text-[#241F16]">
      <header className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <span className="text-lg font-extrabold tracking-tight">TanyaHarga</span>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#241F16]/70">
          <Link href="/dashboard" className="hover:text-[#241F16] transition-colors">Dashboard</Link>
          <Link href="/report-price" className="hover:text-[#241F16] transition-colors">Lapor Harga</Link>
          <Link href="/watchlist" className="hover:text-[#241F16] transition-colors">Watchlist</Link>
        </nav>
        <Button
          render={<Link href="/login" />}
          size="sm"
          className="bg-[#2F5D46] text-[#FAF3E4] hover:bg-[#2F5D46]/85"
        >
          Masuk
        </Button>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-10 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
            Harga pasar hari ini,{' '}
            <span className="text-[#2F5D46]">dari warga untuk warga.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#241F16]/70 max-w-md">
            Ketik laporan harga dengan kalimat bebas — AI kami yang mengekstrak datanya.
            Nggak perlu login buat mulai, dan makin banyak yang lapor, makin akurat papan harganya.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              render={<Link href="/report-price" />}
              size="lg"
              className="bg-[#D98A1F] text-[#241F16] hover:bg-[#D98A1F]/85"
            >
              Lapor Harga Sekarang
            </Button>
            <Button render={<Link href="/dashboard" />} variant="outline" size="lg">
              Lihat Dashboard
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E4D8BE] shadow-[0_1px_0_#E4D8BE] p-6 sm:p-7">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-extrabold text-lg">📋 Papan Harga Hari Ini</h2>
            <span className="text-xs text-[#241F16]/50">Live dari laporan warga</span>
          </div>

          {priceBoard.length > 0 ? (
            <ul>
              {priceBoard.map((item, i) => (
                <li
                  key={item.commodityId}
                  className={`flex items-center justify-between py-3 ${
                    i < priceBoard.length - 1 ? 'border-b border-dashed border-[#E4D8BE]' : ''
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{item.commodityName}</p>
                    <p className="text-xs text-[#241F16]/50">
                      {item.singleMarketName ?? `${item.marketCount} pasar`} · {formatTimeAgo(item.latestReportedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-sm tabular-nums">
                      {formatRupiah(Math.round(item.averagePrice))}
                    </p>
                    <p className="text-xs">
                      {item.indicator.emoji} {item.indicator.label}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-[#241F16]/60">
                Papan harga masih kosong — belum ada yang lapor hari ini.
              </p>
              <Button render={<Link href="/report-price" />} size="sm" className="bg-[#2F5D46] text-[#FAF3E4]">
                Jadi yang pertama lapor
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border-y border-[#E4D8BE]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-center mb-10">Cara Kerja</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Ketik bebas',
                desc: 'Tulis laporan seperti ngobrol biasa: "Pasar Induk hari ini cabai rawit 45rb, telur 26rb/kg".',
              },
              {
                step: '02',
                title: 'AI ekstrak otomatis',
                desc: 'Kalimat bebas kamu langsung diubah jadi data terstruktur: komoditas, harga, satuan, dan pasar.',
              },
              {
                step: '03',
                title: 'Langsung masuk dashboard',
                desc: 'Laporanmu ikut menghitung rata-rata harga terbaru, dan bisa dipantau siapa saja lewat watchlist.',
              },
            ].map((item) => (
              <div key={item.step}>
                <span className="font-mono text-sm text-[#2F5D46] font-semibold">{item.step}</span>
                <h3 className="font-bold mt-2 mb-1">{item.title}</h3>
                <p className="text-sm text-[#241F16]/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              href: '/dashboard',
              title: 'Dashboard Harga',
              desc: 'Rata-rata harga terbaru dari berbagai pasar, lengkap indikator murah/mahal.',
            },
            {
              href: '/report-price',
              title: 'Lapor Harga',
              desc: 'Bagikan harga yang kamu temui di pasar. Gratis, tanpa login untuk beberapa laporan pertama.',
            },
            {
              href: '/watchlist',
              title: 'Watchlist',
              desc: 'Pantau komoditas favoritmu, dapat sinyal begitu harganya naik atau turun.',
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="block rounded-2xl border border-[#E4D8BE] bg-white p-6 hover:border-[#2F5D46] transition-colors"
            >
              <h3 className="font-bold mb-1">{card.title}</h3>
              <p className="text-sm text-[#241F16]/70">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E4D8BE]">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-[#241F16]/50">
          TanyaHarga — dibuat untuk transparansi harga pasar tradisional Indonesia.
        </div>
      </footer>
    </div>
  );
}