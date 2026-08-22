import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get('commodity');
    const market = searchParams.get('market');

    let query = supabase
      .from('prices')
      .select('price, quantity, unit, price_per_base_unit, reported_at, commodities!inner(name), markets!inner(name)')
      .order('reported_at', { ascending: false });

    if (commodity) {
      query = query.ilike('commodities.name', `%${commodity}%`);
    }

    if (market) {
      query = query.ilike('markets.name', `%${market}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prices:', error);
      return NextResponse.json({ error: 'Gagal mengambil data harga' }, { status: 500 });
    }

    const formatted = data?.map((row) => ({
      commodity: (row.commodities as unknown as { name: string }).name,
      market: (row.markets as unknown as { name: string }).name,
      price: row.price,
      quantity: row.quantity,
      unit: row.unit,
      pricePerBaseUnit: row.price_per_base_unit,
      reportedAt: row.reported_at,
    }));

    return NextResponse.json({ data: formatted ?? [] });
  } catch (error) {
    console.error('Unexpected error in /api/prices:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}