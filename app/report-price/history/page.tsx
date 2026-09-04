import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/navbar';
import { getPaginationMeta } from '@/lib/pagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

const ITEMS_PER_PAGE = 8;

export default async function ReportPriceHistoryPage({ searchParams }: PageProps) {
  const { page } = await searchParams;

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/report-price/history');
  }

  // 1. Ambil seluruh data riwayat milik user
  const { data: rawPrices, error } = await supabaseServer
    .from('prices')
    .select('id, price, quantity, unit, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
    .eq('reporter_id', user.id)
    .order('reported_at', { ascending: false });

  if (error) {
    console.error('Error fetching report history:', error);
  }

  const allRows = (rawPrices ?? []).map((row) => ({
    id: row.id,
    commodityName: (row.commodities as unknown as { name: string }).name,
    marketName: (row.markets as unknown as { name: string }).name,
    price: row.price,
    quantity: row.quantity,
    unit: row.unit,
    pricePerBaseUnit: row.price_per_base_unit,
    reportedAt: row.reported_at,
  }));

  // 2. Hitung pagination metadata & slice items
  const pagination = getPaginationMeta(page, allRows.length, ITEMS_PER_PAGE);
  const paginatedRows = allRows.slice(pagination.startIndex, pagination.endIndex);

  return (
    <div className="bg-[#FBF8F3] text-[#223326] min-h-screen font-sans antialiased">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D5] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#223326]">
              Riwayat Laporan Saya
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6E60]">
              Menampilkan {allRows.length} total catatan laporan dari akunmu.
            </p>
          </div>
          <Link
            href="/report-price"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B6543] hover:underline bg-[#3B6543]/10 px-3 py-2 rounded-xl self-start sm:self-auto"
          >
            + Lapor Baru
          </Link>
        </div>

        {/* History Content */}
        <div className="bg-white rounded-3xl border border-[#E8E1D5] p-4 sm:p-6 shadow-sm">
          {paginatedRows.length > 0 ? (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E1D5] text-xs uppercase font-serif text-[#5C6E60] tracking-wider">
                      <th className="pb-3 pr-4 font-bold">Tanggal</th>
                      <th className="pb-3 pr-4 font-bold">Komoditas</th>
                      <th className="pb-3 pr-4 font-bold">Pasar</th>
                      <th className="pb-3 pr-4 font-bold">Harga Laporan</th>
                      <th className="pb-3 pr-4 font-bold">Kuantitas</th>
                      <th className="pb-3 font-bold text-right">Harga / Satuan Dasar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D5]/60">
                    {paginatedRows.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FBF8F3] transition-colors">
                        <td className="py-3.5 pr-4 text-xs text-[#5C6E60]">
                          {new Date(row.reportedAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3.5 pr-4 font-semibold text-[#223326]">{row.commodityName}</td>
                        <td className="py-3.5 pr-4 text-xs text-[#5C6E60]">{row.marketName}</td>
                        <td className="py-3.5 pr-4 font-mono font-bold text-[#3B6543]">
                          Rp{row.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-[#5C6E60]">
                          {row.quantity} {row.unit}
                        </td>
                        <td className="py-3.5 text-right font-mono text-xs font-semibold text-[#223326]">
                          Rp{Math.round(row.pricePerBaseUnit).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD LIST */}
              <div className="md:hidden space-y-3">
                {paginatedRows.map((row) => (
                  <div
                    key={row.id}
                    className="p-4 rounded-2xl bg-[#FBF8F3] border border-[#E8E1D5] space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base text-[#223326]">{row.commodityName}</h3>
                        <p className="text-xs text-[#5C6E60]">📍 {row.marketName}</p>
                      </div>
                      <span className="text-[10px] text-[#5C6E60] bg-white px-2 py-0.5 rounded-full border border-[#E8E1D5]">
                        {new Date(row.reportedAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#E8E1D5]/60 text-xs">
                      <div>
                        <p className="text-[10px] text-[#5C6E60] uppercase tracking-wider font-semibold">Harga Input</p>
                        <p className="font-mono font-bold text-sm text-[#3B6543]">
                          Rp{row.price.toLocaleString('id-ID')}{' '}
                          <span className="font-normal text-[11px] text-[#5C6E60]">({row.quantity} {row.unit})</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#5C6E60] uppercase tracking-wider font-semibold">Harga Base Unit</p>
                        <p className="font-mono font-bold text-xs text-[#223326]">
                          Rp{Math.round(row.pricePerBaseUnit).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
              />
            </>
          ) : (
            <div className="py-12 text-center text-xs sm:text-sm text-[#5C6E60] space-y-3">
              <p>Kamu belum pernah membuat laporan harga.</p>
              <Link
                href="/report-price"
                className="inline-block bg-[#3B6543] text-white px-4 py-2 rounded-xl text-xs font-medium"
              >
                Mulai Lapor Pertama
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}