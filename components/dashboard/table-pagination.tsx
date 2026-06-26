'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName: string;
}

export function TablePagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, itemName }: TablePaginationProps) {
  const visiblePages = Array.from(
    new Set([currentPage - 1, currentPage, currentPage + 1].filter((page) => page >= 1 && page <= totalPages)),
  );
  const fromItem = totalItems === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const toItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Mostrando {fromItem} a {toItem} de {totalItems} {itemName}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage <= 1}>
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only">Pagina anterior</span>
        </Button>
        <div className="flex items-center gap-1">
          {visiblePages.map((page) => (
            <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => onPageChange(page)} className="h-8 w-8 p-0">
              {page}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="sr-only">Pagina siguiente</span>
        </Button>
      </div>
    </div>
  );
}
