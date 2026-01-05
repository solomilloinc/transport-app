'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  ArrowRight, 
  Download, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { useApi } from '@/hooks/use-api';
import { getPassengers } from '@/services/passenger';
import { getCustomerAccountSummary } from '@/services/customerAccount';
import { Passenger } from '@/interfaces/passengers';
import { CustomerAccountSummary, Transaction } from '@/interfaces/customerAccount';
import { PaginationParams } from '@/services/types';
import { usePaginationParams } from '@/utils/pagination';

export default function DebtsPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Passenger | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // API Hooks
  const { data: searchResults, loading: searching, fetch: fetchSearch } = useApi<Passenger, PaginationParams>(getPassengers, { autoFetch: false });
  
  const params = usePaginationParams({
    pageNumber: currentPage,
    pageSize: pageSize,
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
    }
  });

  const { data: summary, loading, fetch: fetchSummary } = useApi<Transaction, PaginationParams, CustomerAccountSummary>(
    (p) => selectedCustomer ? getCustomerAccountSummary(selectedCustomer.CustomerId, p) : { call: Promise.resolve({ Transactions: { Items: [], TotalRecords: 0, TotalPages: 0, PageNumber: 1, PageSize: 10 } }) } as any,
    { autoFetch: false }
  );

  // Debounced passenger search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.length >= 3) {
        fetchSearch({ filters: { search: customerSearch } });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Fetch summary when customer or params change
  useEffect(() => {
    if (selectedCustomer) {
      fetchSummary(params);
    }
  }, [selectedCustomer, params]);

  const handleSelectCustomer = (customer: Passenger) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.FirstName} ${customer.LastName}`);
    setIsCustomerPopoverOpen(false);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const columns = [
    { 
      header: 'Fecha', 
      accessor: 'Date', 
      width: '15%',
      cell: (t: Transaction) => format(new Date(t.Date), 'dd/MM/yyyy HH:mm', { locale: es })
    },
    { header: 'Descripción', accessor: 'Description', width: '45%' },
    { 
      header: 'Tipo', 
      accessor: 'TransactionType', 
      width: '15%',
      cell: (t: Transaction) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          t.TransactionType === 'Payment' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {t.TransactionType === 'Payment' ? 'Pago' : 'Cargo'}
        </span>
      )
    },
    { 
      header: 'Monto', 
      accessor: 'Amount', 
      className: 'text-right',
      width: '15%',
      cell: (t: Transaction) => (
        <span className={`font-semibold ${t.Amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
          $ {Math.abs(t.Amount).toLocaleString()}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estado de Cuenta"
        description="Visualice y gestione las deudas y transacciones de los pasajeros."
        action={
          <Button variant="outline" disabled={!selectedCustomer}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="customer-search">Pasajero</Label>
              <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="customer-search"
                      placeholder="Buscar por nombre..."
                      className="pl-10"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        if (!isCustomerPopoverOpen) setIsCustomerPopoverOpen(true);
                      }}
                      onClick={() => setIsCustomerPopoverOpen(true)}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="max-h-60 overflow-y-auto">
                    {searching ? (
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (searchResults?.Items?.length ?? 0) > 0 ? (
                      searchResults.Items.map((p) => (
                        <div
                          key={p.CustomerId}
                          className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-0"
                          onClick={() => handleSelectCustomer(p)}
                        >
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <UserIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.FirstName} {p.LastName}</p>
                            <p className="text-xs text-gray-500">DNI: {p.DocumentNumber}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {customerSearch.length < 3 ? 'Escriba al menos 3 letras' : 'No se encontraron pasajeros'}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Desde</Label>
              <Input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Hasta</Label>
              <div className="flex gap-2">
                <Input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)}
                />
                <Button variant="ghost" className="px-3" onClick={resetFilters}>X</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCustomer ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-blue-100 text-sm font-medium">Balance Actual</p>
                  <Wallet className="h-5 w-5 text-blue-200" />
                </div>
                <h3 className="text-3xl font-bold">
                  $ {summary?.CurrentBalance?.toLocaleString() ?? 0}
                </h3> 
                <p className="mt-2 text-xs text-blue-200">Total acumulado a la fecha</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-sm font-medium">Pagos (Rango)</p>
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-green-600">
                  $ {summary?.Transactions?.Items?.filter((t: any) => t.TransactionType === 'Payment').reduce((acc: number, t: any) => acc + Math.abs(t.Amount), 0).toLocaleString() ?? 0}
                </h3>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-sm font-medium">Cargos (Rango)</p>
                  <ArrowDownLeft className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-3xl font-bold text-red-600">
                  $ {summary?.Transactions?.Items?.filter((t: any) => t.TransactionType === 'Charge').reduce((acc: number, t: any) => acc + t.Amount, 0).toLocaleString() ?? 0}
                </h3>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardTable
                columns={columns}
                data={summary?.Transactions?.Items ?? []}
                emptyMessage="No se encontraron transacciones para este periodo."
                isLoading={loading}
                skeletonRows={pageSize}
              />
              
              {(summary?.Transactions?.TotalRecords ?? 0) > 0 && (
                <div className="mt-4">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={summary?.Transactions?.TotalPages}
                    totalItems={summary?.Transactions?.TotalRecords}
                    itemsPerPage={pageSize}
                    onPageChange={setCurrentPage}
                    itemName="transacciones"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 flex flex-col items-center justify-center text-gray-400">
            <UserIcon className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Seleccione un pasajero para ver su estado de cuenta</p>
            <p className="text-sm">Utilice la barra de búsqueda superior para comenzar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
