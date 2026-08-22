'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function WatchlistButton({
  commodityId,
  marketId, // 🆕 BARU
  initialIsWatched,
  isLoggedIn,
}: {
  commodityId: string;
  marketId: string | null; // 🆕 BARU
  initialIsWatched: boolean;
  isLoggedIn: boolean;
}) {
  const [isWatched, setIsWatched] = useState(initialIsWatched);

  async function handleClick() {
    if (!isLoggedIn) {
      window.location.href = '/login?redirectTo=/dashboard';
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isWatched) {
      // ✏️ DIUBAH — tambahkan filter market_id (pakai `.is()` khusus untuk cek NULL,
      // bukan `.eq()`, karena `.eq('market_id', null)` tidak akan match apapun di Postgres)
      let deleteQuery = supabase.from('watchlist').delete().eq('commodity_id', commodityId).eq('user_id', user.id);
      deleteQuery = marketId ? deleteQuery.eq('market_id', marketId) : deleteQuery.is('market_id', null);
      await deleteQuery;
      setIsWatched(false);
    } else {
      // ✏️ DIUBAH — sertakan market_id saat insert
      await supabase.from('watchlist').insert({
        commodity_id: commodityId,
        market_id: marketId,
        user_id: user.id,
      });
      setIsWatched(true);
    }
  }

  return (
    <button onClick={handleClick} title={isWatched ? 'Hapus dari watchlist' : 'Tambah ke watchlist'}>
      {isWatched ? '⭐' : '☆'}
    </button>
  );
}