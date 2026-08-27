import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseGroqPriceQuestion } from '@/lib/groq';
import { priceQuestionSchema, type PriceAnswer } from '@/lib/schemas';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { checkAnonymousQuota, setQuotaCookie } from '@/lib/quota';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question: string = body.question;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'Pertanyaan tidak boleh kosong' }, { status: 400 });
    }

    // 1. Ambil daftar commodities & markets existing untuk context AI
    const { data: commodities } = await supabase.from('commodities').select('id, name');
    const { data: markets } = await supabase.from('markets').select('id, name');

    const existingCommodityNames = commodities?.map((c) => c.name) ?? [];
    const existingMarketNames = markets?.map((m) => m.name) ?? [];

    // Cek Kuota
    const supabaseServer = await createServerSupabaseClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      const { allowed } = await checkAnonymousQuota('anon_ask_price_at');
      if (!allowed) {
        return NextResponse.json(
          {
            error: 'Jatah tanya harga gratis hari ini sudah habis. Login untuk tanya tanpa batas.',
            requiresLogin: true,
          },
          { status: 403 }
        );
      }
    }

    // 2. Panggil Groq untuk extract intent & entity (commodities, market, intent)
    const aiResult = await parseGroqPriceQuestion(question, existingCommodityNames, existingMarketNames);

    // 3. Validasi bentuk hasil AI dengan Zod
    const parsed = priceQuestionSchema.safeParse(aiResult);
    if (!parsed.success) {
      console.error('Zod validation failed:', JSON.stringify(parsed.error.issues, null, 2));
      return NextResponse.json({ error: 'Tidak bisa memahami pertanyaan, coba lagi' }, { status: 422 });
    }

    const { commodities: askedCommodities, market, intent } = parsed.data;

    // 4. Untuk tiap komoditas yang ditanyakan, query database berdasarkan intent
    const answers: PriceAnswer[] = [];

    for (const commodityName of askedCommodities) {
      let query = supabase
        .from('prices')
        .select('price, quantity, unit, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
        .ilike('commodities.name', `%${commodityName}%`);

      if (market) {
        query = query.ilike('markets.name', `%${market}%`);
      }

      // DINAMIS: Urutkan data berdasarkan intent yang diekstrak AI
      if (intent === 'cheapest') {
        // Cari harga per unit acuan TERMURAH
        query = query.order('price_per_base_unit', { ascending: true });
      } else if (intent === 'pricy') {
        // Cari harga per unit acuan TERMAHAL
        query = query.order('price_per_base_unit', { ascending: false });
      } else {
        // Default (latest): Cari data laporan TERBARU
        query = query.order('reported_at', { ascending: false });
      }

      const { data: rows } = await query.limit(1);
      const row = rows?.[0];

      if (row) {
        // Beri label/catatan kecil di nama komoditas agar user paham ini hasil termurah/termahal
        let note = '';
        if (intent === 'cheapest') note = ' (Termurah)';
        if (intent === 'pricy') note = ' (Termahal)';

        answers.push({
          commodity: `${commodityName}${note}`,
          found: true,
          market: (row.markets as unknown as { name: string }).name,
          price: row.price,
          quantity: row.quantity,
          unit: row.unit,
          reportedAt: row.reported_at,
        });
      } else {
        answers.push({ commodity: commodityName, found: false });
      }
    }

    const response = NextResponse.json({ answers });

    if (!user) {
      setQuotaCookie(response, 'anon_ask_price_at');
    }

    return response;

  } catch (error) {
    console.error('Unexpected error in /api/ask-price:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}