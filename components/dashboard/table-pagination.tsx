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
    <div className="flex flex-col gap-4 px-1 py-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} {itemName}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="h-9 rounded-full border-sky-100/90 bg-white px-3 text-slate-700 hover:bg-sky-50"
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
                  ? 'h-9 w-9 rounded-full border-0 bg-[linear-gradient(135deg,#0f3f8f,#2563eb)] p-0 text-white shadow-[0_10px_20px_rgba(37,99,235,0.16)]'
                  : 'h-9 w-9 rounded-full border-sky-100/90 bg-white p-0 text-slate-700 hover:bg-sky-50'
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
          className="h-9 rounded-full border-sky-100/90 bg-white px-3 text-slate-700 hover:bg-sky-50"
        >
          <ChevronRightIcon className="h-4 w-4" />
          <span className="sr-only">Pagina siguiente</span>
        </Button>
      </div>
    </div>
  );
}
