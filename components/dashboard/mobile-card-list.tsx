'use client';

import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MobileCardListProps<T> {
  items?: T[];
  isLoading?: boolean;
  emptyMessage: string;
  skeletonRows?: number;
  children: (item: T) => ReactNode;
}

export function MobileCardList<T>({
  items = [],
  isLoading = false,
  emptyMessage,
  skeletonRows = 3,
  children,
}: MobileCardListProps<T>) {
  if (isLoading && items.length === 0) {
    return (
      <div className="md:hidden space-y-4">
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Card key={`mobile-card-skeleton-${index}`} className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((__, fieldIndex) => (
                  <div key={`mobile-card-skeleton-field-${fieldIndex}`} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="md:hidden text-center p-4 border rounded-md">{emptyMessage}</div>;
  }

  return <div className="md:hidden space-y-4">{items.map(children)}</div>;
}
