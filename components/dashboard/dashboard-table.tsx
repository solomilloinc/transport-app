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
    <div className="rounded-md border w-full">
      <div className="w-full overflow-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessor} className={column.hidden ? 'hidden md:table-cell' : column.className} style={{ width: column.width || `${100 / visibleColumns.length}%` }}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
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
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={`${index}-${column.accessor}`}
                      className={column.hidden ? 'hidden md:table-cell' : column.className}
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
