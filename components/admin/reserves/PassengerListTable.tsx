'use client';

import { ArrowUpDown, ChevronDown, ChevronUp, DollarSign, Edit2, TrashIcon, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
      return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
    }
    return sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4 inline" /> : <ChevronDown className="ml-1 h-4 w-4 inline" />;
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">Cargando pasajeros...</div>;
  }

  if (!passengers || passengers.length === 0) {
    return <div className="text-center py-10 text-gray-500">No hay pasajeros en este viaje.</div>;
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="border-b text-left text-sm font-medium text-gray-500">
            <th className="py-3 pr-4 w-[24%]">
              <button className="flex items-center font-medium text-gray-500 hover:text-gray-700" onClick={() => onSort('name')}>
                Pasajero {renderSortIndicator('name')}
              </button>
            </th>
            <th className="py-3 pr-4 w-[11%]">
              <button
                className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                onClick={() => onSort('pickup')}
              >
                Subida {renderSortIndicator('pickup')}
              </button>
            </th>
            <th className="py-3 pr-4 text-center w-[10%]">
              <button
                className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                onClick={() => onSort('paid')}
              >
                Estado Pago {renderSortIndicator('paid')}
              </button>
            </th>
            <th className="py-3 pr-4 w-[22%] text-center">
              <button
                className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                onClick={() => onSort('paymentMethod')}
              >
                Medio de pago {renderSortIndicator('paymentMethod')}
              </button>
            </th>
            <th className="py-3 pr-4 text-center w-[12%]">
              <button
                className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                onClick={() => onSort('paidAmount')}
              >
                Monto {renderSortIndicator('paidAmount')}
              </button>
            </th>
            <th className="py-3 pl-4 text-right w-[25%]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((passenger) => (
            <tr key={passenger.PassengerId} className="border-b">
              <td className="py-3 pr-4">
                <div className="flex items-center">
                  <Checkbox
                    id={`passenger-${passenger.CustomerId}`}
                    checked={passenger.HasTraveled}
                    onCheckedChange={(checked) => onCheckPassenger(passenger, checked as boolean)}
                    className="mr-2"
                    disabled={disabledPassengers.includes(passenger.PassengerId)}
                  />
                  <div>
                    <label htmlFor={`passenger-${passenger.PassengerId}`} className="font-medium">
                      {passenger.FullName}
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>DNI: {passenger.DocumentNumber}</span>
                      {passenger.DocumentNumber && (passenger.CurrentBalance) !== null && passenger.CurrentBalance !== 0 && (
                        <span className={(passenger.CurrentBalance) > 0 ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                          {(passenger.CurrentBalance) > 0
                            ? `Debe $${passenger.CurrentBalance.toLocaleString()}`
                            : `A favor $${Math.abs(passenger.CurrentBalance).toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-center">
                {/* Dropdown for pickup location can be added here if needed */}
                {passenger.PickupLocationName}
              </td>
              <td className="py-3 pr-4 text-center">
                {(() => {
                  const status = passenger.Status ?? passenger.StatusPaymentId;
                  const label = PaymentStatusLabels[status] || 'Desconocido';
                  let badgeClass = 'bg-gray-100 text-gray-700';
                  if (status === PaymentStatusEnum.PendingPayment) badgeClass = 'bg-yellow-100 text-yellow-800';
                  else if (status === PaymentStatusEnum.Confirmed) badgeClass = 'bg-green-100 text-green-700';
                  else if (status === PaymentStatusEnum.Cancelled) badgeClass = 'bg-red-100 text-red-700';
                  else if (status === PaymentStatusEnum.Traveled) badgeClass = 'bg-blue-100 text-blue-700';
                  else if (status === PaymentStatusEnum.NoShow) badgeClass = 'bg-gray-200 text-gray-600';
                  else if (status === PaymentStatusEnum.Refunded) badgeClass = 'bg-purple-100 text-purple-700';
                  return (
                    <div className="flex items-center justify-center gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}`}>
                        {label}
                      </span>
                      {status === PaymentStatusEnum.PendingPayment && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-yellow-600 hover:bg-yellow-50"
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
              <td className="py-3 pr-4 text-center">{passenger.PaymentMethods}</td>
              <td className="py-3 pr-4 text-center font-medium">
                ${(passenger.PaidAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 pl-4 text-right">
                <div className="flex justify-end items-center">
                  <div
                    className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ml-4 mr-2 ${
                      passenger.HasTraveled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {passenger.HasTraveled ? 'Subió' : 'No subió'}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => onEdit(passenger)}
                    title="Editar Reserva"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onDelete(passenger)}
                    title="Eliminar Pasajero"
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
