'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function WatchlistButton({
  commodityId,
  marketId,
  initialIsWatched,
  isLoggedIn,
}: {
  commodityId: string;
  marketId: string | null;
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
      let deleteQuery = supabase.from('watchlist').delete().eq('commodity_id', commodityId).eq('user_id', user.id);
      deleteQuery = marketId ? deleteQuery.eq('market_id', marketId) : deleteQuery.is('market_id', null);
      const { error } = await deleteQuery;
      if (error) {
        console.error('Gagal hapus watchlist:', error);
        return;
      }
      setIsWatched(false);
    } else {
      const { error } = await supabase.from('watchlist').insert({
        commodity_id: commodityId,
        market_id: marketId,
        user_id: user.id,
      });
      if (error) {
        console.error('Gagal simpan watchlist:', error);
        return;
      }
      setIsWatched(true);
    }
  }

  return (
    <button onClick={handleClick} title={isWatched ? 'Hapus dari watchlist' : 'Tambah ke watchlist'}>
      {isWatched ? '⭐' : '☆'}
    </button>
  );
}