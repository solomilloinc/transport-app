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
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-black/6 bg-white/78 px-4 py-4 shadow-[0_16px_34px_rgba(22,34,24,0.06)] sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} {itemName}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="h-9 rounded-full border-black/8 bg-white/80 px-3 text-slate-700"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only">Pagina anterior</span>
        </Button>
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={
                currentPage === page
                  ? 'h-9 w-9 rounded-full border-0 bg-[linear-gradient(135deg,#182b1f,#35533f)] p-0 text-white shadow-none'
                  : 'h-9 w-9 rounded-full border-black/8 bg-white/80 p-0 text-slate-700'
              }
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="h-9 rounded-full border-black/8 bg-white/80 px-3 text-slate-700"
        >
          <ChevronRightIcon className="h-4 w-4" />
          <span className="sr-only">Pagina siguiente</span>
        </Button>
      </div>
    </div>
  );
}
