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
    <div className="w-full overflow-hidden rounded-[1.35rem] border border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,250,255,0.98))] shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
      <div className="w-full overflow-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="border-sky-100/80 bg-[linear-gradient(180deg,rgba(240,248,255,0.98),rgba(233,244,255,0.94))]">
              {columns.map((column) => (
                <TableHead
                  key={column.accessor}
                  className={
                    column.hidden
                      ? 'hidden text-[11px] uppercase tracking-[0.18em] text-slate-500 md:table-cell'
                      : `text-[11px] uppercase tracking-[0.18em] text-slate-500 ${column.className || ''}`
                  }
                  style={{ width: column.width || `${100 / visibleColumns.length}%` }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="border-sky-100/70 bg-white">
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
                <TableRow
                  key={index}
                  className={
                    index % 2 === 0
                      ? 'border-sky-100/70 bg-white hover:bg-sky-50/60'
                      : 'border-sky-100/70 bg-[rgba(248,251,255,0.96)] hover:bg-sky-50/80'
                  }
                >
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
                <TableCell colSpan={columns.length} className="h-24 bg-white text-center text-slate-500">
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
