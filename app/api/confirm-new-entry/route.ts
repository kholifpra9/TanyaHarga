import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

const confirmSchema = z.object({
  commodity: z.string().min(1),
  category: z.string().optional(),
  market: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const { commodity, category, market, price, quantity, unit } = parsed.data;

    // 1. Cari commodity yang sudah ada by name, kalau belum ada, buat baru
    const { data: existingCommodity } = await supabaseAdmin
      .from('commodities')
      .select('id')
      .eq('name', commodity)
      .maybeSingle();

    let commodityId = existingCommodity?.id;
    if (!commodityId) {
      // PERBAIKAN: Masukkan field `category` saat insert ke tabel commodities
      const { data: newCommodity, error } = await supabaseAdmin
        .from('commodities')
        .insert({
          name: commodity,
          category: category?.trim().toLowerCase() || 'lainnya',
          base_unit: unit,
        })
        .select('id')
        .single();
      if (error) throw error;
      commodityId = newCommodity.id;
    }

    // 2. Cari market yang sudah ada by name, kalau belum ada, buat baru
    const { data: existingMarket } = await supabaseAdmin
      .from('markets')
      .select('id')
      .eq('name', market)
      .maybeSingle();

    let marketId = existingMarket?.id;
    if (!marketId) {
      const { data: newMarket, error } = await supabaseAdmin
        .from('markets')
        .insert({ name: market })
        .select('id')
        .single();
      if (error) throw error;
      marketId = newMarket.id;
    }

    // 3. Insert ke prices
    const { error: priceError } = await supabaseAdmin.from('prices').insert({
      commodity_id: commodityId,
      market_id: marketId,
      price,
      quantity,
      unit,
      price_per_base_unit: price / quantity,
    });

    if (priceError) throw priceError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Confirm new entry error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
  }
}