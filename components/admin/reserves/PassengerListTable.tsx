'use client';

import { ArrowUpDown, ChevronDown, ChevronUp, DollarSign, Edit2, TrashIcon, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PassengerReserveReport, PaymentStatusEnum, PaymentStatusLabels } from '@/interfaces/passengerReserve';

export type PassengerSortColumn = 'name' | 'pickup' | 'paid' | 'paymentMethod' | 'paidAmount';
type SortDirection = 'asc' | 'desc';

const paymentStatusBadgeClasses: Record<number, string> = {
  [PaymentStatusEnum.PendingPayment]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatusEnum.Confirmed]: 'bg-green-100 text-green-700',
  [PaymentStatusEnum.Cancelled]: 'bg-red-100 text-red-700',
  [PaymentStatusEnum.Traveled]: 'bg-blue-100 text-blue-700',
  [PaymentStatusEnum.NoShow]: 'bg-gray-200 text-gray-600',
  [PaymentStatusEnum.Refunded]: 'bg-purple-100 text-purple-700',
};

interface PassengerListTableProps {
  passengers: PassengerReserveReport[] | undefined;
  isLoading: boolean;
  sortColumn: PassengerSortColumn;
  sortDirection: SortDirection;
  onSort: (column: PassengerSortColumn) => void;
  onCheckPassenger: (passenger: PassengerReserveReport, checked: boolean) => void;
  onEdit: (passenger: PassengerReserveReport) => void;
  onDelete: (passenger: PassengerReserveReport) => void;
  onCancel: (passenger: PassengerReserveReport) => void;
  onAddPayment: (passenger: PassengerReserveReport) => void;
  getClientBalance: (dni: string) => number | null;
  disabledPassengers?: number[];
  /** La Reserve seleccionada ya partió: gatea Mover/Cancelar de todas las filas. */
  reserveHasDeparted?: boolean;
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
  onCancel,
  onAddPayment,
  getClientBalance,
  disabledPassengers = [],
  reserveHasDeparted = false,
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
            <th className="py-3 pr-4 w-[15%]">
              <button
                className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                onClick={() => onSort('pickup')}
              >
                Subida {renderSortIndicator('pickup')}
              </button>
            </th>
            <th className="py-3 pr-4 text-center w-[12%]">
              <button
                className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                onClick={() => onSort('paid')}
              >
                Pago {renderSortIndicator('paid')}
              </button>
            </th>
            <th className="py-3 pr-4 w-[17%] text-center">
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
            <th className="py-3 pl-6 text-right w-[20%]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((passenger) => (
            <tr key={passenger.passengerId} className="border-b">
              <td className="py-3 pr-4">
                <div className="flex items-center">
                  <Checkbox
                    id={`passenger-${passenger.customerId}`}
                    checked={passenger.hasTraveled}
                    onCheckedChange={(checked) => onCheckPassenger(passenger, checked as boolean)}
                    className="mr-2"
                    disabled={disabledPassengers.includes(passenger.passengerId)}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label htmlFor={`passenger-${passenger.passengerId}`} className="text-sm font-medium">
                        {passenger.fullName}
                      </label>
                      {passenger.frequentSubscriptionId != null && (
                        // Badge: este Passenger fue auto-creado por el batch
                        // a partir de una FrequentSubscription activa.
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700"
                          title={`Generado por la suscripción frecuente #${passenger.frequentSubscriptionId}`}
                        >
                          Frecuente
                        </span>
                      )}
                      {false && passenger.reserveRelatedId != null &&
                        (passenger.totalAmount ?? 0) === 0 && (
                          // Badge: este Passenger es la pata del package IdaVuelta.
                          // Convención Mayo 2026: el outbound carga el total, el return va a 0.
                          // Sin este badge, el admin podría asumir que el ticket es gratis.
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800"
                            title={`Parte del paquete IdaVuelta — cobro en Reserve #${passenger.reserveRelatedId}`}
                          >
                            Paquete IdaVuelta
                          </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>DNI: {passenger.documentNumber}</span>
                      {/* "Deuda vencida": saldo SOLO por viajes ya realizados — lo cobrable
                          sin riesgo (ver CONTEXT.md). `null` = sin cliente; `0` = sin deuda;
                          en ambos casos no se muestra nada. No se renderiza saldo "a favor"
                          acá: el crédito es del total de cuenta corriente, no de la deuda vencida. */}
                      {passenger.overdueBalance != null && passenger.overdueBalance > 0 && (
                        <span className="text-red-500 font-medium">
                          Debe ${passenger.overdueBalance.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-center text-sm">
                {/* Dropdown for pickup location can be added here if needed */}
                <span className="block whitespace-normal break-words leading-tight">
                  {passenger.pickupLocationName}
                </span>
              </td>
              <td className="py-3 pr-4 text-center">
                {(() => {
                  const status = passenger.status ?? passenger.statusPaymentId;
                  const label = PaymentStatusLabels[status] || 'Desconocido';
                  const badgeClass = paymentStatusBadgeClasses[status] || 'bg-gray-100 text-gray-700';
                  return (
                    <div className="grid grid-cols-[1fr_1.5rem] items-center gap-1">
                      <span className={`mx-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}`}>
                        {label}
                      </span>
                      {status === PaymentStatusEnum.PendingPayment ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                          onClick={() => onAddPayment(passenger)}
                          title="Agregar pago"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span aria-hidden="true" className="h-6 w-6" />
                      )}
                    </div>
                  );
                })()}
              </td>
              <td className="py-3 pr-4 text-center text-sm">{passenger.paymentMethods}</td>
              <td className="py-3 pr-4 text-center text-sm font-medium">
                ${(passenger.totalAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 pl-6 text-right">
                <div className="grid grid-cols-[5.5rem_4.25rem] items-center justify-end gap-2">
                  <div
                    className={`justify-self-center whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      passenger.hasTraveled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {passenger.hasTraveled ? 'Subió' : 'No subió'}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => onEdit(passenger)}
                      title="Editar Reserva"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  {(() => {
                    // Gating (ver charter §2 + CONTEXT.md): sólo pasajeros activos
                    // (PendingPayment/Confirmed) y con la Reserve sin partir.
                    const status = passenger.status ?? passenger.statusPaymentId;
                    const isActive =
                      status === PaymentStatusEnum.PendingPayment ||
                      status === PaymentStatusEnum.Confirmed;
                    const canCancel = isActive && !reserveHasDeparted;
                    const cancelTitle = canCancel
                      ? 'Cancelar pasajero'
                      : 'No se puede cancelar: el viaje partió o el pasajero no está activo';
                    return (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-orange-500 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40"
                        onClick={() => onCancel(passenger)}
                        disabled={!canCancel}
                        title={cancelTitle}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    );
                    })()}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
