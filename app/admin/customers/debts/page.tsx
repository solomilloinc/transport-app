'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Search,
  User as UserIcon,
  Download,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Plus,
  Undo2,
  Loader2
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { MobileCardList } from '@/components/dashboard/mobile-card-list';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { Skeleton } from '@/components/ui/skeleton';

import { useApi } from '@/hooks/use-api';
import { getPassengers } from '@/services/passenger';
import { getCustomerAccountSummary } from '@/services/customerAccount';
import {
  createCustomerAccountAdjustmentAction,
  refundPaymentCashAction,
} from '@/app/admin/customers/actions';
import { Passenger } from '@/interfaces/passengers';
import { CustomerAccountAdjustmentKind, CustomerAccountSummary, Transaction, TransactionTypeLabels, TransactionTypeOptions } from '@/interfaces/customerAccount';
import { PaginationParams } from '@/services/types';
import { usePaginationParams } from '@/utils/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DebtSettlementDialog } from '@/components/admin/reserves/DebtSettlementDialog';
import { PaymentMethod } from '@/interfaces/payment';
import { SelectOption } from '@/components/dashboard/select';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DebtsPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Passenger | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  
  const [fromDate, setFromDate] = useState<string>(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [transactionType, setTransactionType] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isDebtSettlementOpen, setIsDebtSettlementOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentKind, setAdjustmentKind] = useState<CustomerAccountAdjustmentKind>('Credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adjustmentDescription, setAdjustmentDescription] = useState('');
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  const { toast } = useToast();
  // Fila (movimiento de pago) pendiente de confirmar la devolución de caja.
  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  const paymentMethodOptions: SelectOption[] = Object.entries(PaymentMethod)
    .filter(([, value]) => typeof value === 'number' && value !== PaymentMethod.Online && value !== PaymentMethod.AccountCredit)
    .map(([key, value]) => ({
      id: value as number,
      value: (value as number).toString(),
      label: key,
    }));

  // API Hooks
  const { data: searchResults, loading: searching, fetch: fetchSearch } = useApi<Passenger, PaginationParams>(getPassengers, { autoFetch: false });
  
  const params = usePaginationParams({
    pageNumber: currentPage,
    pageSize: pageSize,
    filters: {
      transactionType: transactionType ? parseInt(transactionType) : null,
      fromDate: fromDate || null,
      toDate: toDate || null,
    }
  });

  const { data: rawSummary, loading, fetch: fetchSummary } = useApi<any, PaginationParams, any>(
    (p) => selectedCustomer ? getCustomerAccountSummary(selectedCustomer.customerId, p) : { call: Promise.resolve(null) } as any,
    { autoFetch: false }
  );

  const summary = useMemo((): CustomerAccountSummary | null => {
    if (!rawSummary) return null;
    // Unwrap { isSuccess, value } wrapper if the API still returns it.
    const val = rawSummary?.isSuccess !== undefined ? rawSummary.value : rawSummary;
    if (!val) return null;
    const txns = val.transactions;
    if (!txns) return null;
    const items = txns.items || [];
    return {
      customerId: val.customerId ?? 0,
      customerFullName: val.customerFullName ?? '',
      currentBalance: val.currentBalance ?? 0,
      rangeTotalPagos: val.rangeTotalPagos ?? 0,
      rangeTotalCargos: val.rangeTotalCargos ?? 0,
      transactions: {
        items: items.map((t: any) => ({
          id: t.id,
          customerId: t.customerId,
          description: t.description ?? '',
          transactionType: t.transactionType ?? '',
          amount: t.amount ?? 0,
          date: t.date ?? '',
          reservePaymentId: t.reservePaymentId ?? null,
          reservePaymentStatus: t.reservePaymentStatus ?? null,
          relatedReserveId: t.relatedReserveId ?? null,
        })),
        pageNumber: txns.pageNumber ?? 1,
        pageSize: txns.pageSize ?? 10,
        totalRecords: txns.totalRecords ?? 0,
        totalPages: txns.totalPages ?? 0,
      },
    };
  }, [rawSummary]);

  // Debounced passenger search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.length >= 3) {
        fetchSearch({ filters: { search: customerSearch.trim() } } as any);
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
    setCustomerSearch(`${customer.lastName} ${customer.firstName}`);
    setIsCustomerPopoverOpen(false);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setIsCustomerPopoverOpen(false);
    setFromDate(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
    setToDate(format(new Date(), 'yyyy-MM-dd'));
    setTransactionType('');
    setCurrentPage(1);
  };

  const getTransactionTypeStyle = (type: string) => {
    switch (type) {
      case 'Payment':
        return 'bg-green-100 text-green-800';
      case 'Charge':
        return 'bg-red-100 text-red-800';
      case 'Adjustment':
        return 'bg-yellow-100 text-yellow-800';
      case 'Refund':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetAdjustmentForm = () => {
    setAdjustmentKind('Credit');
    setAdjustmentAmount('');
    setAdjustmentDate(format(new Date(), 'yyyy-MM-dd'));
    setAdjustmentDescription('');
  };

  const handleCreateAdjustment = async () => {
    if (!selectedCustomer) return;

    const amount = Number(adjustmentAmount);
    const description = adjustmentDescription.trim();

    if (!amount || amount <= 0) {
      toast({ title: 'Monto inválido', description: 'El monto debe ser mayor a cero.', variant: 'destructive' });
      return;
    }

    if (!adjustmentDate) {
      toast({ title: 'Fecha requerida', description: 'Seleccioná una fecha para el ajuste.', variant: 'destructive' });
      return;
    }

    if (!description) {
      toast({ title: 'Descripción requerida', description: 'Ingresá una descripción para el ajuste.', variant: 'destructive' });
      return;
    }

    setIsSavingAdjustment(true);
    const result = await createCustomerAccountAdjustmentAction(selectedCustomer.customerId, {
      adjustmentKind,
      amount,
      date: adjustmentDate,
      description,
    });
    if (!result.ok) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      setIsSavingAdjustment(false);
      return;
    }

    toast({
      title: 'Ajuste registrado',
      description: adjustmentKind === 'Credit'
        ? 'Se registró un ajuste a favor del pasajero.'
        : 'Se registró un ajuste adeudado.',
      variant: 'success',
    });
    setIsAdjustmentOpen(false);
    resetAdjustmentForm();
    const refreshedParams = { ...params, pageNumber: 1 };
    setCurrentPage(1);
    fetchSummary(refreshedParams);
    setIsSavingAdjustment(false);
  };

  const handleConfirmRefund = async () => {
    if (!refundTarget?.reservePaymentId) return;
    setIsRefunding(true);
    const result = await refundPaymentCashAction(refundTarget.reservePaymentId);
    if (!result.ok) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      setIsRefunding(false);
      return;
    }
    toast({
      title: 'Dinero devuelto',
      description: 'La devolución de caja se registró correctamente.',
      variant: 'success',
    });
    setRefundTarget(null);
    // Refrescar la grilla: el pago queda "Refunded" y deja de ofrecer el botón.
    if (selectedCustomer) fetchSummary(params);
    setIsRefunding(false);
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'Date',
      width: '15%',
      cell: (t: Transaction) => format(new Date(t.date), 'dd/MM/yyyy HH:mm', { locale: es })
    },
    { header: 'Descripción', accessor: 'description', width: '45%' },
    {
      header: 'Tipo',
      accessor: 'transactionType',
      width: '15%',
      cell: (t: Transaction) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeStyle(t.transactionType)}`}>
          {TransactionTypeLabels[t.transactionType] || t.transactionType}
        </span>
      )
    },
    {
      header: 'Monto',
      accessor: 'Amount',
      className: 'text-right',
      width: '15%',
      cell: (t: Transaction) => (
        <span className={`font-semibold ${t.amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
          $ {Math.abs(t.amount).toLocaleString()}
        </span>
      )
    },
    {
      header: '',
      accessor: 'actions',
      className: 'text-right',
      width: '8%',
      cell: (t: Transaction) =>
        t.transactionType === 'Payment' && t.reservePaymentStatus === 'Paid' && t.reservePaymentId != null ? (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  aria-label="Devolver dinero"
                  onClick={() => setRefundTarget(t)}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Devolver dinero</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null,
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
          <div className="grid gap-3 lg:grid-cols-[260px_190px_150px_150px_auto] lg:items-end">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Pasajero</span>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="customer-search"
                  placeholder="Buscar por nombre..."
                  className="pl-10"
                  value={customerSearch}
                  autoComplete="off"
                  onFocus={() => setIsCustomerPopoverOpen(true)}
                  onBlur={() => {
                    // Delay so click on a result registers before the dropdown unmounts
                    setTimeout(() => setIsCustomerPopoverOpen(false), 150);
                  }}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerPopoverOpen(true);
                  }}
                />
                {isCustomerPopoverOpen && (
                  <div className="absolute z-50 mt-1 w-[300px] rounded-md border bg-white shadow-md">
                    <div className="max-h-60 overflow-y-auto">
                      {searching ? (
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : (searchResults?.items?.length ?? 0) > 0 ? (
                        searchResults.items.map((p) => (
                          <div
                            key={p.customerId}
                            className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectCustomer(p)}
                          >
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <UserIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{p.lastName} {p.firstName}</p>
                              <p className="text-xs text-gray-500">DNI: {p.documentNumber}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          {customerSearch.length < 3 ? 'Escriba al menos 3 letras' : 'No se encontraron pasajeros'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Tipo de transacción</span>
              <Select value={transactionType || 'all'} onValueChange={(value) => { setTransactionType(value === 'all' ? '' : value); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {TransactionTypeOptions.map((option) => (
                    <SelectItem key={option.value || 'all'} value={option.value || 'all'}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Desde</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Hasta</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button variant="outline" onClick={resetFilters}>
                Restablecer
              </Button>
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
                  $ {summary?.currentBalance?.toLocaleString() ?? 0}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-blue-200">Total acumulado a la fecha</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!summary || (summary.currentBalance ?? 0) <= 0}
                    onClick={() => setIsDebtSettlementOpen(true)}
                  >
                    <DollarSign className="mr-1 h-3.5 w-3.5" />
                    Saldar Deuda
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-sm font-medium">Pagos (Rango)</p>
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-green-600">
                  $ {summary?.rangeTotalPagos?.toLocaleString() ?? 0}
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
                  $ {summary?.rangeTotalCargos?.toLocaleString() ?? 0}
                </h3>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Transacciones</CardTitle>
              <Button
                size="sm"
                onClick={() => setIsAdjustmentOpen(true)}
                disabled={!selectedCustomer}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar ajuste
              </Button>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block">
                <DashboardTable
                  columns={columns}
                  data={summary?.transactions?.items ?? []}
                  emptyMessage="No se encontraron transacciones para este periodo."
                  isLoading={loading}
                  skeletonRows={pageSize}
                />
              </div>
              <MobileCardList
                items={summary?.transactions?.items ?? []}
                isLoading={loading}
                emptyMessage="No se encontraron transacciones para este periodo."
                skeletonRows={pageSize > 3 ? 3 : pageSize}
              >
                {(t) => (
                  <MobileCard
                    key={t.id}
                    title={TransactionTypeLabels[t.transactionType] || t.transactionType}
                    subtitle={format(new Date(t.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    badge={
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeStyle(t.transactionType)}`}>
                        {TransactionTypeLabels[t.transactionType] || t.transactionType}
                      </span>
                    }
                    fields={[
                      { label: 'Descripcion', value: t.description || '-' },
                      { label: 'Reserva', value: t.relatedReserveId ? `#${t.relatedReserveId}` : '-' },
                      {
                        label: 'Monto',
                        value: (
                          <span className={t.amount < 0 ? 'text-green-600' : 'text-red-600'}>
                            $ {Math.abs(t.amount).toLocaleString()}
                          </span>
                        ),
                      },
                    ]}
                    actions={
                      t.transactionType === 'Payment' && t.reservePaymentStatus === 'Paid' && t.reservePaymentId != null ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setRefundTarget(t)}
                        >
                          <Undo2 className="mr-1 h-3.5 w-3.5" />
                          Devolver dinero
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </MobileCardList>
              
              {(summary?.transactions?.totalRecords ?? 0) > 0 && (
                <div className="mt-4">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={summary?.transactions?.totalPages ?? 0}
                    totalItems={summary?.transactions?.totalRecords ?? 0}
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

      <DebtSettlementDialog
        open={isDebtSettlementOpen}
        onOpenChange={setIsDebtSettlementOpen}
        customer={selectedCustomer}
        currentBalance={summary?.currentBalance}
        paymentMethodOptions={paymentMethodOptions}
        onSuccess={() => {
          if (selectedCustomer) fetchSummary(params);
        }}
      />

      <FormDialog
        open={isAdjustmentOpen}
        onOpenChange={(open) => {
          setIsAdjustmentOpen(open);
          if (!open && !isSavingAdjustment) resetAdjustmentForm();
        }}
        title="Agregar ajuste"
        description="Registrá un ajuste manual en la cuenta corriente del pasajero."
        onSubmit={handleCreateAdjustment}
        submitText="Guardar ajuste"
        isLoading={isSavingAdjustment}
        disabled={!selectedCustomer || isSavingAdjustment}
        preventClose={isSavingAdjustment}
        className="sm:max-w-md"
      >
        <FormField label="Tipo de ajuste" required>
          <Select
            value={adjustmentKind}
            onValueChange={(value) => setAdjustmentKind(value as CustomerAccountAdjustmentKind)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Credit">A favor</SelectItem>
              <SelectItem value="Debt">Adeudado</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Monto" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={adjustmentAmount}
            onChange={(e) => setAdjustmentAmount(e.target.value)}
          />
        </FormField>

        <FormField label="Fecha" required>
          <Input
            type="date"
            value={adjustmentDate}
            onChange={(e) => setAdjustmentDate(e.target.value)}
          />
        </FormField>

        <FormField label="Descripción" required>
          <Input
            placeholder="Motivo del ajuste"
            value={adjustmentDescription}
            onChange={(e) => setAdjustmentDescription(e.target.value)}
          />
        </FormField>
      </FormDialog>

      <AlertDialog open={refundTarget != null} onOpenChange={(open) => { if (!open && !isRefunding) setRefundTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Devolver dinero</AlertDialogTitle>
            <AlertDialogDescription>
              Se devolverá en efectivo, desde la caja, el monto de este pago
              {refundTarget ? ` ($ ${Math.abs(refundTarget.amount).toLocaleString()})` : ''}.
              {' '}El pasajero debe estar cancelado previamente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefunding}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmRefund(); }}
              disabled={isRefunding}
            >
              {isRefunding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Devolver dinero
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
