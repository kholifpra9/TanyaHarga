'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  paramName?: string; // Default: 'page', tetapi bisa disesuaikan per halaman
  className?: string;
};

export function PaginationControls({
  currentPage,
  totalPages,
  paramName = 'page',
  className = '',
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, page.toString());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between border-t border-[#E8E1D5] pt-4 mt-6 text-xs sm:text-sm ${className}`}
    >
      <p className="text-[#5C6E60]">
        Halaman <span className="font-bold text-[#223326]">{currentPage}</span> dari{' '}
        <span className="font-bold text-[#223326]">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="px-3.5 py-1.5 rounded-xl border border-[#E8E1D5] bg-white font-medium text-[#223326] hover:bg-[#FBF8F3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          ← Sebelum
        </button>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="px-3.5 py-1.5 rounded-xl border border-[#E8E1D5] bg-white font-medium text-[#223326] hover:bg-[#FBF8F3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          Selanjutnya →
        </button>
      </div>
    </div>
  );
}