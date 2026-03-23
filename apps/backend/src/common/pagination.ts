export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

export function getPagination(page?: number, limit?: number) {
  const usePagination = page !== undefined || limit !== undefined;

  return {
    usePagination,
    page: Math.max(page ?? 1, 1),
    limit: Math.max(limit ?? 20, 1),
  };
}

export function toPaginatedResult<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> {
  return {
    items,
    page,
    limit,
    total,
    hasNext: page * limit < total,
  };
}
