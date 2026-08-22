import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseGroqPriceReport } from '@/lib/groq';
import { priceReportResponseSchema } from '@/lib/schemas';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { checkAnonymousQuota, setQuotaCookie } from '@/lib/quota';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawText: string = body.rawText;

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: 'Teks laporan tidak boleh kosong' }, { status: 400 });
    }

    // 1. Ambil daftar commodities & markets existing untuk jadi context AI
    const { data: commodities } = await supabaseAdmin.from('commodities').select('id, name');
    const { data: markets } = await supabaseAdmin.from('markets').select('id, name');

    const existingCommodityNames = commodities?.map((c) => c.name) ?? [];
    const existingMarketNames = markets?.map((m) => m.name) ?? [];

    // Cek Kuota
    const supabaseServer = await createServerSupabaseClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      const { allowed } = await checkAnonymousQuota('anon_report_price_at');
      if (!allowed) {
        return NextResponse.json(
          {
            error: 'Jatah laporan gratis hari ini sudah habis. Login untuk lapor tanpa batas.',
            requiresLogin: true,
          },
          { status: 403 }
        );
      }
    }

    // 2. Panggil Groq untuk parsing teks bebas jadi JSON
    const aiResult = await parseGroqPriceReport(rawText, existingCommodityNames, existingMarketNames);

    // 3. Validasi bentuk hasil AI dengan Zod
    const parsed = priceReportResponseSchema.safeParse(aiResult);
    if (!parsed.success) {
      console.error('Zod validation failed:', JSON.stringify(parsed.error.issues, null, 2));
      return NextResponse.json(
        { error: 'Format hasil AI tidak sesuai, coba lagi' },
        { status: 422 }
      );
    }

    const items = parsed.data.items;

    // 4. Pisahkan item yang siap langsung disimpan vs yang butuh konfirmasi user dulu
    //    (human-in-the-loop untuk komoditas/pasar baru — lihat dokumen arsitektur section 5.1)
    const itemsToSave = items.filter((item) => !item.is_new_commodity && !item.is_new_market);
    const itemsNeedingConfirmation = items.filter((item) => item.is_new_commodity || item.is_new_market);

    // 5. Insert item yang sudah cocok dengan data existing
    let savedCount = 0;
    if (itemsToSave.length > 0) {
      const commodityIdMap = new Map(commodities?.map((c) => [c.name, c.id]));
      const marketIdMap = new Map(markets?.map((m) => [m.name, m.id]));

      const rowsToInsert = itemsToSave.map((item) => ({
        commodity_id: commodityIdMap.get(item.commodity),
        market_id: marketIdMap.get(item.market),
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        price_per_base_unit: item.price / item.quantity,
        raw_text: rawText,
        reporter_id: user?.id ?? null,
      }));

      const { error: insertError, count } = await supabaseAdmin
        .from('prices')
        .insert(rowsToInsert)

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: 'Gagal menyimpan ke database' }, { status: 500 });
      }

      savedCount = rowsToInsert.length;
    }

    // 6. Return hasil ke frontend
    const responseBody = {
      saved: itemsToSave,
      savedCount,
      needsConfirmation: itemsNeedingConfirmation,
    };

    const response = NextResponse.json(responseBody);

    if (!user) {
      setQuotaCookie(response, 'anon_report_price_at');
    }

    return response;
    
  } catch (error) {
    console.error('Unexpected error in /api/report-price:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}