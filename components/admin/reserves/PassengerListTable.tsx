'use client';

import { ArrowUpDown, ChevronDown, ChevronUp, DollarSign, Edit2, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PassengerReserveReport, PaymentStatusEnum, PaymentStatusLabels } from '@/interfaces/passengerReserve';

export type PassengerSortColumn = 'name' | 'pickup' | 'paid' | 'paymentMethod' | 'paidAmount';
type SortDirection = 'asc' | 'desc';

interface PassengerListTableProps {
  passengers: PassengerReserveReport[] | undefined;
  isLoading: boolean;
  sortColumn: PassengerSortColumn;
  sortDirection: SortDirection;
  onSort: (column: PassengerSortColumn) => void;
  onCheckPassenger: (passenger: PassengerReserveReport, checked: boolean) => void;
  onEdit: (passenger: PassengerReserveReport) => void;
  onDelete: (passenger: PassengerReserveReport) => void;
  onAddPayment: (passenger: PassengerReserveReport) => void;
  getClientBalance: (dni: string) => number | null;
  disabledPassengers?: number[];
}

export function PassengerListTable({
  passengers,
  isLoading,
  sortColumn,
  sortDirection,
  onSort,
  onCheckPassenger,
  onEdit,
  onDelete,
  onAddPayment,
  getClientBalance,
  disabledPassengers = [],
}: PassengerListTableProps) {
  const renderSortIndicator = (column: PassengerSortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 inline h-4 w-4" />;
    }

    return sortDirection === 'asc' ? <ChevronUp className="ml-1 inline h-4 w-4" /> : <ChevronDown className="ml-1 inline h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="rounded-[1.25rem] border border-dashed border-black/8 py-10 text-center text-sm text-slate-500">Cargando pasajeros...</div>;
  }

  if (!passengers || passengers.length === 0) {
    return <div className="rounded-[1.25rem] border border-dashed border-black/8 py-10 text-center text-sm text-slate-500">No hay pasajeros en este viaje.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-black/6 bg-white/72">
      <table className="w-full min-w-[980px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-black/6 bg-[#f5f6f1] text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <th className="w-[24%] px-4 py-4">
              <button className="flex items-center font-semibold text-slate-500 hover:text-slate-800" onClick={() => onSort('name')}>
                Pasajero {renderSortIndicator('name')}
              </button>
            </th>
            <th className="w-[12%] px-4 py-4 text-center">
              <button className="mx-auto flex items-center font-semibold text-slate-500 hover:text-slate-800" onClick={() => onSort('pickup')}>
                Subida {renderSortIndicator('pickup')}
              </button>
            </th>
            <th className="w-[14%] px-4 py-4 text-center">
              <button className="mx-auto flex items-center font-semibold text-slate-500 hover:text-slate-800" onClick={() => onSort('paid')}>
                Estado pago {renderSortIndicator('paid')}
              </button>
            </th>
            <th className="w-[18%] px-4 py-4 text-center">
              <button className="mx-auto flex items-center font-semibold text-slate-500 hover:text-slate-800" onClick={() => onSort('paymentMethod')}>
                Medio de pago {renderSortIndicator('paymentMethod')}
              </button>
            </th>
            <th className="w-[12%] px-4 py-4 text-center">
              <button className="mx-auto flex items-center font-semibold text-slate-500 hover:text-slate-800" onClick={() => onSort('paidAmount')}>
                Monto {renderSortIndicator('paidAmount')}
              </button>
            </th>
            <th className="w-[20%] px-4 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((passenger) => (
            <tr key={passenger.PassengerId} className="border-b border-black/5 text-sm text-slate-700 transition-colors hover:bg-[#fbfcf8]">
              <td className="px-4 py-4">
                <div className="flex items-center">
                  <Checkbox
                    id={`passenger-${passenger.CustomerId}`}
                    checked={passenger.HasTraveled}
                    onCheckedChange={(checked) => onCheckPassenger(passenger, checked as boolean)}
                    className="mr-3 border-black/20"
                    disabled={disabledPassengers.includes(passenger.PassengerId)}
                  />
                  <div>
                    <label htmlFor={`passenger-${passenger.PassengerId}`} className="font-semibold text-slate-900">
                      {passenger.FullName}
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>DNI: {passenger.DocumentNumber}</span>
                      {passenger.DocumentNumber && passenger.CurrentBalance !== null && passenger.CurrentBalance !== 0 && (
                        <span className={passenger.CurrentBalance > 0 ? 'font-semibold text-red-500' : 'font-semibold text-emerald-700'}>
                          {passenger.CurrentBalance > 0
                            ? `Debe $${passenger.CurrentBalance.toLocaleString()}`
                            : `A favor $${Math.abs(passenger.CurrentBalance).toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">{passenger.PickupLocationName}</td>
              <td className="px-4 py-4 text-center">
                {(() => {
                  const status = passenger.Status ?? passenger.StatusPaymentId;
                  const label = PaymentStatusLabels[status] || 'Desconocido';
                  let badgeClass = 'border border-slate-200 bg-slate-100 text-slate-700';

                  if (status === PaymentStatusEnum.PendingPayment) badgeClass = 'border border-amber-200 bg-amber-50 text-amber-800';
                  else if (status === PaymentStatusEnum.Confirmed) badgeClass = 'border border-emerald-200 bg-emerald-50 text-emerald-700';
                  else if (status === PaymentStatusEnum.Cancelled) badgeClass = 'border border-red-200 bg-red-50 text-red-700';
                  else if (status === PaymentStatusEnum.Traveled) badgeClass = 'border border-sky-200 bg-sky-50 text-sky-700';
                  else if (status === PaymentStatusEnum.NoShow) badgeClass = 'border border-slate-200 bg-slate-200 text-slate-600';
                  else if (status === PaymentStatusEnum.Refunded) badgeClass = 'border border-violet-200 bg-violet-50 text-violet-700';

                  return (
                    <div className="flex items-center justify-center gap-1">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${badgeClass}`}>
                        {label}
                      </span>
                      {status === PaymentStatusEnum.PendingPayment && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-amber-700 hover:bg-amber-50"
                          onClick={() => onAddPayment(passenger)}
                          title="Agregar pago"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </td>
              <td className="px-4 py-4 text-center">{passenger.PaymentMethods}</td>
              <td className="px-4 py-4 text-center font-semibold text-slate-900">
                ${(passenger.PaidAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div
                    className={
                      passenger.HasTraveled
                        ? 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700'
                        : 'rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500'
                    }
                  >
                    {passenger.HasTraveled ? 'Subio' : 'No subio'}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-black/6 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={() => onEdit(passenger)}
                    title="Editar reserva"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onDelete(passenger)}
                    title="Eliminar pasajero"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
