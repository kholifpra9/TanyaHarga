import { redirect } from 'next/navigation';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ReportPriceHistoryPage() {
  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  // Halaman ini punya data privat (laporan milik user), jadi wajib login.
  // Kalau belum, lempar ke login dan balikin lagi ke sini setelah berhasil.
  if (!user) {
    redirect('/login?redirectTo=/report-price/history');
  }

  // Query prices MILIK user ini saja — filter reporter_id = user.id,
  // sama persis pola join yang dipakai dashboard (Epic 4)
  const { data: rawPrices, error } = await supabaseServer
    .from('prices')
    .select('id, price, quantity, unit, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
    .eq('reporter_id', user.id)
    .order('reported_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching report history:', error);
  }

  const rows = (rawPrices ?? []).map((row) => ({
    id: row.id,
    commodityName: (row.commodities as unknown as { name: string }).name,
    marketName: (row.markets as unknown as { name: string }).name,
    price: row.price,
    quantity: row.quantity,
    unit: row.unit,
    pricePerBaseUnit: row.price_per_base_unit,
    reportedAt: row.reported_at,
  }));

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Laporan Saya</h1>
        <p className="text-sm text-muted-foreground">
          Login sebagai {user.email}. Menampilkan {rows.length} laporan terakhir.
        </p>
      </div>

      {rows.length > 0 ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Tanggal</th>
              <th className="py-2 pr-4">Komoditas</th>
              <th className="py-2 pr-4">Pasar</th>
              <th className="py-2 pr-4">Harga</th>
              <th className="py-2 pr-4">Kuantitas</th>
              <th className="py-2">Harga / satuan dasar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2 pr-4 text-muted-foreground">
                  {new Date(row.reportedAt).toLocaleDateString('id-ID')}
                </td>
                <td className="py-2 pr-4">{row.commodityName}</td>
                <td className="py-2 pr-4">{row.marketName}</td>
                <td className="py-2 pr-4">Rp{row.price.toLocaleString('id-ID')}</td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {row.quantity} {row.unit}
                </td>
                <td className="py-2">
                  Rp{Math.round(row.pricePerBaseUnit).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted-foreground">Kamu belum pernah lapor harga.</p>
      )}
    </div>
  );
}