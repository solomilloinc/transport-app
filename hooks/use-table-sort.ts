'use client';

import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

/**
 * A custom hook to manage sorting for a table.
 * @param items The array of items to sort.
 * @param initialSortColumn The initial column to sort by.
 * @param sortFns A map of column keys to their sorting functions.
 * @returns An object containing the sorted items and sorting state/handlers.
 */
export function useTableSort<T, K extends string>(
  items: T[] | undefined,
  initialSortColumn: K,
  sortFns: { [key in K]: (a: T, b: T) => number }
) {
  const [sortColumn, setSortColumn] = useState<K>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: K) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!items) return [];

    const sortFn = sortFns[sortColumn];
    if (!sortFn) return items;

    return [...items].sort((a, b) => {
      const comparison = sortFn(a, b);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortColumn, sortDirection, sortFns]);

  return {
    sortedItems,
    sortColumn,
    sortDirection,
    handleSort,
  };
}