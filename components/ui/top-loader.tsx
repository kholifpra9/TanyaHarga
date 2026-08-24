'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TopLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Selesai loading begitu URL / Query Params berganti
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Deteksi tap/klik pada tautan <a> internal
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor && anchor.href) {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Jika mengarah ke halaman lain dalam domain yang sama
        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
        ) {
          setIsLoading(true);
        }
      }
    }

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-[#E8E1D5] overflow-hidden">
      <div className="h-full bg-[#3B6543] animate-pulse w-3/4 rounded-r-full transition-all duration-300" />
    </div>
  );
}

export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderContent />
    </Suspense>
  );
}