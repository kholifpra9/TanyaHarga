import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
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
    <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#EFEAE1] border border-[#E8E1D5] px-3.5 py-1.5 rounded-full text-xs font-medium text-[#5C6E60]">
              <span className="w-2 h-2 rounded-full bg-[#C86D51]" />
              Catatan pangan lokal langsung dari lapangan
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#223326] leading-[1.12]">
              Cek harga sembako di pasarmu pakai kalimat biasa.
            </h1>

            <p className="text-base sm:text-lg text-[#5C6E60] leading-relaxed max-w-xl">
              Tanyakan harga komoditas seperti mengobrol biasa, AI kami yang mengekstrak dan mencari catatan harganya dari laporan warga.
            </p>

            {/* SPOTLIGHT UTAMA: Tanya Harga Direct to /ask-price */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-[#E8E1D5] shadow-sm max-w-xl space-y-2">
              <form action="/ask-price" method="GET" className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="q"
                  placeholder='Contoh: "cabe rawit sama telur berapa?"'
                  className="w-full px-4 py-3 text-sm bg-[#FBF8F3] rounded-xl sm:rounded-2xl text-[#223326] placeholder:text-[#5C6E60]/50 border border-[#E8E1D5] focus:outline-none focus:border-[#3B6543]"
                />
                <Button
                  type="submit"
                  className="bg-[#3B6543] text-[#FBF8F3] hover:bg-[#2D4E33] font-medium px-6 py-3 rounded-xl sm:rounded-2xl shrink-0 w-full sm:w-auto text-center"
                >
                  Tanya AI
                </Button>
              </form>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 pt-1 text-xs text-[#5C6E60] gap-1">
                <span>Tanya harga tanpa perlu isi form rumit</span>
                <Link href="/ask-price" className="text-[#3B6543] font-semibold hover:underline">
                  Buka Laman Tanya Harga →
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative h-[380px] sm:h-[420px] w-full rounded-3xl overflow-hidden border border-[#E8E1D5] shadow-sm">
              <Image 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                alt="Aktivitas bahan pokok di pasar tradisional"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#223326]/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-[#FBF8F3]">
                <p className="text-xs font-serif italic text-[#E8E1D5]">Pasar Induk & Pasar Rakyat</p>
                <p className="text-lg font-bold">Transparansi Informasi dari Komunitas Warga</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Papan Pantau */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl border border-[#E8E1D5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E1D5] pb-4 mb-6">
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#223326]">📋 Papan Pantau Hari Ini</h2>
              <p className="text-xs text-[#5C6E60] mt-0.5">Rata-rata terhitung dari laporan warga terkini</p>
            </div>
            <Link href="/dashboard" className="text-xs font-semibold text-[#3B6543] hover:underline mt-2 sm:mt-0">
              Lihat Dashboard →
            </Link>
          </div>

          {priceBoard.length > 0 ? (
            <div className="divide-y divide-[#E8E1D5]">
              {priceBoard.map((item) => (
                <div key={item.commodityId} className="py-3.5 flex items-center justify-between gap-4 px-2 hover:bg-[#FBF8F3] rounded-xl transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-[#223326]">{item.commodityName}</p>
                    <p className="text-xs text-[#5C6E60]">
                      {item.singleMarketName ?? `${item.marketCount} pasar`} · {formatTimeAgo(item.latestReportedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-[#223326] tabular-nums">
                      {formatRupiah(Math.round(item.averagePrice))}
                    </p>
                    <p className="text-xs text-[#5C6E60]">
                      {item.indicator.emoji} {item.indicator.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-[#5C6E60]">Papan harga masih kosong hari ini.</p>
              <Button nativeButton={false} render={<Link href="/report-price" />} size="sm" className="bg-[#3B6543] text-white">
                Lapor Pertama
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Secondary CTAs */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#F4EFE6] p-8 rounded-3xl border border-[#E8E1D5] flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#C86D51] uppercase tracking-wider">Lapor Belanjaan</span>
              <h3 className="font-serif font-bold text-2xl text-[#223326]">Punya Laporan Harga Baru?</h3>
              <p className="text-sm text-[#5C6E60] leading-relaxed">
                Tulis bebas catatan belanjaan kamu hari ini, AI kami akan mengubahnya menjadi data publik yang bermanfaat.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/report-price" />}
              className="bg-[#C86D51] text-white hover:bg-[#b05a40] rounded-xl font-medium px-6 self-start"
            >
              + Lapor Harga Belanja
            </Button>
          </div>

          <div className="bg-[#F4EFE6] p-8 rounded-3xl border border-[#E8E1D5] flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#3B6543] uppercase tracking-wider">Dashboard Analisis</span>
              <h3 className="font-serif font-bold text-2xl text-[#223326]">Pantau Grafik Komoditas</h3>
              <p className="text-sm text-[#5C6E60] leading-relaxed">
                Lihat tren pergerakan harga bahan pokok di berbagai pasar dalam 7 hari terakhir secara transparan.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              variant="outline"
              className="border-[#3B6543] text-[#3B6543] hover:bg-[#3B6543]/10 rounded-xl font-medium px-6 self-start"
            >
              Lihat Dashboard
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E8E1D5] bg-[#F4EFE6] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#5C6E60]">
          <p>© TanyaHarga. Inisiatif transparansi pangan warga.</p>
          <div className="flex gap-6">
            <Link href="/ask-price" className="hover:text-[#223326]">Tanya Harga</Link>
            <Link href="/dashboard" className="hover:text-[#223326]">Dashboard</Link>
            <Link href="/report-price" className="hover:text-[#223326]">Lapor Harga</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}