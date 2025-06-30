'use client';

import { ArrowUpDown, ChevronDown, ChevronUp, CurrencyIcon, Edit2, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PassengerReserveReport } from '@/interfaces/passengerReserve';

type SortColumn = 'name' | 'pickup' | 'dropoff' | 'paid' | 'paymentMethod' | 'price';
type SortDirection = 'asc' | 'desc';

interface PassengerListTableProps {
  passengers: PassengerReserveReport[] | undefined;
  isLoading: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  onCheckPassenger: (passenger: PassengerReserveReport, checked: boolean) => void;
  onEdit: (passenger: PassengerReserveReport) => void;
  onDelete: (passenger: PassengerReserveReport) => void;
  onAddPayment: (passenger: PassengerReserveReport) => void;
  onPriceChange: (id: number, value: string) => void;
  getClientBalance: (dni: string) => number | null;
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
  onPriceChange,
  getClientBalance,
}: PassengerListTableProps) {
  const renderSortIndicator = (column: SortColumn) => {
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
            <th className="py-3 pr-4 w-[20%]">
              <button className="flex items-center font-medium text-gray-500 hover:text-gray-700" onClick={() => onSort('name')}>
                Pasajero {renderSortIndicator('name')}
              </button>
            </th>
            <th className="py-3 pr-4 w-[20%]">
              <button className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto" onClick={() => onSort('pickup')}>
                Subida {renderSortIndicator('pickup')}
              </button>
            </th>
            <th className="py-3 pr-4 text-center">
              <button className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto" onClick={() => onSort('paid')}>
                Pagado {renderSortIndicator('paid')}
              </button>
            </th>
            <th className="py-3 pr-4 w-[15%]">
              <button
                className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                onClick={() => onSort('paymentMethod')}
              >
                Medio de pago {renderSortIndicator('paymentMethod')}
              </button>
            </th>
            <th className="py-3 pr-4 text-center w-[10%]">
              <button className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto" onClick={() => onSort('price')}>
                Monto {renderSortIndicator('price')}
              </button>
            </th>
            <th className="py-3 pl-4 text-right w-[15%]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((passenger) => (
            <tr key={passenger.CustomerReserveId} className="border-b">
              <td className="py-3 pr-4">
                <div className="flex items-center">
                  <Checkbox
                    id={`passenger-${passenger.CustomerId}`}
                    checked={passenger.HasTraveled}
                    onCheckedChange={(checked) => onCheckPassenger(passenger, checked as boolean)}
                    className="mr-2"
                  />
                  <div>
                    <label htmlFor={`passenger-${passenger.CustomerReserveId}`} className="font-medium">
                      {passenger.FullName}
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>DNI: {passenger.DocumentNumber}</span>
                      {passenger.DocumentNumber && getClientBalance(passenger.DocumentNumber) !== null && (
                        <span className={getClientBalance(passenger.DocumentNumber)! < 0 ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                          {getClientBalance(passenger.DocumentNumber)! < 0
                            ? `Debe $${Math.abs(getClientBalance(passenger.DocumentNumber)!).toLocaleString()}`
                            : `A favor $${getClientBalance(passenger.DocumentNumber)!.toLocaleString()}`}
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
                <Checkbox id={`paid-${passenger.CustomerReserveId}`} checked={passenger.IsPayment} className="mx-auto" disabled />
              </td>
              <td className="py-3 pr-4 text-center">{passenger.PaymentMethodName}</td>
              <td className="py-3 pr-4 text-center">
                <Input
                  type="text"
                  value={passenger.Price}
                  onChange={(e) => onPriceChange(passenger.CustomerReserveId, e.target.value)}
                  className={`w-24 text-right font-mono mx-auto ${!passenger.IsPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!passenger.IsPayment}
                />
              </td>
              <td className="py-3 pl-4 text-right">
                <div className="flex justify-end items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={() => onAddPayment(passenger)}
                    disabled={!passenger.IsPayment}
                    title="Añadir Pago"
                  >
                    <CurrencyIcon className="h-4 w-4" />
                  </Button>
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
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
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