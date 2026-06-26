'use client';

import { ArrowUpDown, ChevronDown, ChevronUp, DollarSign, Edit2, TrashIcon, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PassengerReserveReport, PaymentStatusEnum, PaymentStatusLabels } from '@/interfaces/passengerReserve';

export type PassengerSortColumn = 'name' | 'pickup' | 'paid' | 'paymentMethod' | 'paidAmount';
type SortDirection = 'asc' | 'desc';

/**
 * Copy del tooltip cuando una acción se deshabilita por stand-by de pago externo
 * (wallet / MercadoPago). El mismo motivo lo defiende el backend con el código
 * `Passenger.AwaitingExternalPayment` (ver lib/apiErrors.ts).
 */
const AWAITING_EXTERNAL_PAYMENT_TITLE =
  'El pasajero está esperando la confirmación del pago de MercadoPago. No se pueden realizar acciones hasta que el pago se confirme o expire.';

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
          {passengers.map((passenger) => {
            // Stand-by de pago externo (wallet/MercadoPago): la fila no es
            // accionable hasta que el webhook confirme o expire el pago.
            const isAwaitingExternalPayment = passenger.isAwaitingExternalPayment === true;
            return (
            <tr
              key={passenger.passengerId}
              className={`border-b${isAwaitingExternalPayment ? ' bg-violet-50/60' : ''}`}
            >
              <td className="py-3 pr-4">
                <div className="flex items-center">
                  <Checkbox
                    id={`passenger-${passenger.customerId}`}
                    checked={passenger.hasTraveled}
                    onCheckedChange={(checked) => onCheckPassenger(passenger, checked as boolean)}
                    className="mr-2"
                    disabled={
                      disabledPassengers.includes(passenger.passengerId) ||
                      isAwaitingExternalPayment
                    }
                    title={isAwaitingExternalPayment ? AWAITING_EXTERNAL_PAYMENT_TITLE : undefined}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label htmlFor={`passenger-${passenger.passengerId}`} className="font-medium">
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
                      {passenger.reserveRelatedId != null &&
                        (passenger.paidAmount ?? 0) === 0 && (
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
              <td className="py-3 pr-4 text-center">
                {/* Dropdown for pickup location can be added here if needed */}
                {passenger.pickupLocationName}
              </td>
              <td className="py-3 pr-4 text-center">
                {(() => {
                  const status = passenger.status ?? passenger.statusPaymentId;
                  const label = PaymentStatusLabels[status] || 'Desconocido';
                  let badgeClass = 'bg-gray-100 text-gray-700';
                  if (status === PaymentStatusEnum.PendingPayment) badgeClass = 'bg-yellow-100 text-yellow-800';
                  else if (status === PaymentStatusEnum.Confirmed) badgeClass = 'bg-green-100 text-green-700';
                  else if (status === PaymentStatusEnum.Cancelled) badgeClass = 'bg-red-100 text-red-700';
                  else if (status === PaymentStatusEnum.Traveled) badgeClass = 'bg-blue-100 text-blue-700';
                  else if (status === PaymentStatusEnum.NoShow) badgeClass = 'bg-gray-200 text-gray-600';
                  else if (status === PaymentStatusEnum.Refunded) badgeClass = 'bg-purple-100 text-purple-700';
                  // En stand-by de pago externo mostramos una etiqueta propia y
                  // distinta del "Pendiente de pago" común, y NO ofrecemos cargar
                  // pago: el cobro lo confirma MercadoPago.
                  if (isAwaitingExternalPayment) {
                    return (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700"
                        title={AWAITING_EXTERNAL_PAYMENT_TITLE}
                      >
                        Esperando pago (MercadoPago)
                      </span>
                    );
                  }
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
              <td className="py-3 pr-4 text-center">{passenger.paymentMethods}</td>
              <td className="py-3 pr-4 text-center font-medium">
                ${(passenger.paidAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 pl-4 text-right">
                <div className="flex justify-end items-center">
                  <div
                    className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ml-4 mr-2 ${
                      passenger.hasTraveled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {passenger.hasTraveled ? 'Subió' : 'No subió'}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
                    onClick={() => onEdit(passenger)}
                    disabled={isAwaitingExternalPayment}
                    title={isAwaitingExternalPayment ? AWAITING_EXTERNAL_PAYMENT_TITLE : 'Editar Reserva'}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {(() => {
                    // Gating (ver charter §2 + CONTEXT.md): sólo pasajeros activos
                    // (PendingPayment/Confirmed) y con la Reserve sin partir.
                    // Además se bloquea si está en stand-by de pago externo.
                    const status = passenger.status ?? passenger.statusPaymentId;
                    const isActive =
                      status === PaymentStatusEnum.PendingPayment ||
                      status === PaymentStatusEnum.Confirmed;
                    const canCancel = isActive && !reserveHasDeparted && !isAwaitingExternalPayment;
                    const cancelTitle = isAwaitingExternalPayment
                      ? AWAITING_EXTERNAL_PAYMENT_TITLE
                      : canCancel
                        ? 'Cancelar pasajero'
                        : 'No se puede cancelar: el viaje partió o el pasajero no está activo';
                    return (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-orange-500 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40"
                          onClick={() => onCancel(passenger)}
                          disabled={!canCancel}
                          title={cancelTitle}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
