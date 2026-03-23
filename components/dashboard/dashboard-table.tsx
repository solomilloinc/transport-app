import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

interface Column {
  header: string;
  accessor: string;
  cell?: (item: any) => ReactNode;
  className?: string;
  hidden?: boolean;
  width?: string; // Percentage width of the column (e.g., "20%")
}

interface DashboardTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
  isLoading?: boolean;
  skeletonRows?: number;
}

export function DashboardTable({ columns, data, emptyMessage = 'No se encontraron datos.', isLoading = false, skeletonRows = 5 }: DashboardTableProps) {
  const visibleColumns = columns.filter((col) => !col.hidden);

  return (
    <div className="w-full overflow-hidden rounded-[1.5rem] border border-black/6 bg-white/78 shadow-[0_20px_45px_rgba(22,34,24,0.06)]">
      <div className="w-full overflow-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="border-black/6 bg-[linear-gradient(180deg,rgba(245,246,241,0.96),rgba(238,242,234,0.92))]">
              {columns.map((column) => (
                <TableHead key={column.accessor} className={column.hidden ? 'hidden md:table-cell text-slate-500 uppercase tracking-[0.18em] text-[11px]' : `text-slate-500 uppercase tracking-[0.18em] text-[11px] ${column.className || ''}`} style={{ width: column.width || `${100 / visibleColumns.length}%` }}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="border-black/6">
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={`skeleton-${rowIndex}-${colIndex}`}
                      className={column.hidden ? 'hidden md:table-cell' : column.className}
                      style={{ width: column.width || `${100 / visibleColumns.length}%` }}
                    >
                      <Skeleton className="h-6 w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              // Actual data rows
              data.map((item, index) => (
                <TableRow key={index} className="border-black/6 hover:bg-[#f6f7f2]">
                  {columns.map((column) => (
                    <TableCell
                      key={`${index}-${column.accessor}`}
                      className={column.hidden ? 'hidden md:table-cell' : `text-slate-700 ${column.className || ''}`}
                      style={{ width: column.width || `${100 / visibleColumns.length}%` }}
                    >
                      {column.cell ? column.cell(item) : item[column.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty state - only shown when not loading and no data
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
