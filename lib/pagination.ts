// lib/pagination.ts

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
};

export function getPaginationMeta(
  pageParam: string | undefined,
  totalItems: number,
  pageSize: number = 8
): PaginationMeta {
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  };
}

// Untuk query Supabase (Range Query / Server-side Pagination)
export function getSupabaseRange(pageParam: string | undefined, pageSize: number = 8) {
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, from, to };
}