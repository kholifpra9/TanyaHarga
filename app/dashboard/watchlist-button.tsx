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
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      window.location.href = '/login?redirectTo=/dashboard';
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isWatched) {
      let deleteQuery = supabase.from('watchlist').delete().eq('commodity_id', commodityId).eq('user_id', user.id);
      deleteQuery = marketId ? deleteQuery.eq('market_id', marketId) : deleteQuery.is('market_id', null);
      const { error } = await deleteQuery;
      if (!error) setIsWatched(false);
    } else {
      const { error } = await supabase.from('watchlist').insert({
        commodity_id: commodityId,
        market_id: marketId,
        user_id: user.id,
      });
      if (!error) setIsWatched(true);
    }
    setIsLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={isWatched ? 'Hapus dari watchlist' : 'Tambah ke watchlist'}
      className={`p-2 rounded-xl transition-all cursor-pointer ${
        isWatched
          ? 'bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]'
          : 'bg-[#FBF8F3] text-[#5C6E60] border border-[#E8E1D5] hover:border-[#3B6543] hover:text-[#223326]'
      }`}
    >
      <span className="text-base leading-none">{isWatched ? '★' : '☆'}</span>
    </button>
  );
}