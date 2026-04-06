'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es, is } from 'date-fns/locale';
import { PrinterIcon, UserPlusIcon, DollarSignIcon, TicketPlus, Edit2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/page-header';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditTripDialog } from '@/components/admin/reserves/EditTripDialog';
import { AddPaymentDialog } from '@/components/admin/reserves/AddPaymentDialog';
import { DeleteAction, DeleteConfirmationDialog } from '@/components/admin/reserves/DeleteConfirmationDialog';
import { PassengerListTable, PassengerSortColumn } from '@/components/admin/reserves/PassengerListTable';
import { TripSelectionPanel } from '@/components/admin/reserves/TripSelectionPanel';
import { CancelTripDialog } from '@/components/admin/reserves/CancelTripDialog';
import { Label } from '@/components/ui/label';
import { deleteLogic, get, post, put } from '@/services/api';
import { ReserveReport, ReserveStatusEnum, ReserveUpdate } from '@/interfaces/reserve';
import { SelectOption } from '@/components/dashboard/select';
import { PassengerReserveReport, PassengerReserveUpdate } from '@/interfaces/passengerReserve';
import { toast } from '@/hooks/use-toast';
import { Direction } from '@/interfaces/direction';
import { useApi } from '@/hooks/use-api';
import { getPassengerReserves, getReserves } from '@/services/reserves';
import { PaymentMethod } from '@/interfaces/payment';
import { getTripById } from '@/services/trip';
import { EditPassengerReserveDialog } from '@/components/admin/reserves/EditPassengerReserveDialog';
import { AddReservationFlow } from '@/components/admin/reserves/AddReservationFlow';
import { PaymentSummaryDialog } from '@/components/admin/reserves/PaymentSummaryDialog';
import { useTableSort } from '@/hooks/use-table-sort';
import { PagedResponse } from '@/services/types';
import { getCurrentCashBox } from '@/services/cash-box';
import CashBox from '@/interfaces/cash-box';

// Funciones de ordenamiento para la tabla de pasajeros.
// Al no poner un tipo explícito, TypeScript infiere el tipo más específico,
// lo que resuelve el error de asignación en el hook `useTableSort`.
const passengerSortFns = {
  name: (a: PassengerReserveReport, b: PassengerReserveReport) => a.FullName.localeCompare(b.FullName),
  pickup: (a: PassengerReserveReport, b: PassengerReserveReport) => a.PickupLocationName.localeCompare(b.PickupLocationName),
  paid: (a: PassengerReserveReport, b: PassengerReserveReport) => a.StatusPaymentId - b.StatusPaymentId,
  paymentMethod: (a: PassengerReserveReport, b: PassengerReserveReport) => (a.PaymentMethods || '').localeCompare(b.PaymentMethods),
  paidAmount: (a: PassengerReserveReport, b: PassengerReserveReport) => Number(a.PaidAmount) - Number(b.PaidAmount),
};

export default function ReservationsPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [selectedTrip, setSelectedTrip] = useState<ReserveReport | null>(null);
  const [selectedPassengerReserve, setSelectedPassengerReserve] = useState<PassengerReserveReport | null>(null);

  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditPassengerReserveModalOpen, setIsEditPassengerReserveModalOpen] = useState(false);
  const [isAddReservationFlowOpen, setIsAddReservationFlowOpen] = useState(false);
  const [isPaymentSummaryOpen, setIsPaymentSummaryOpen] = useState(false);

  const [directions, setDirections] = useState<SelectOption[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<SelectOption[]>([]);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isCancelTripDialogOpen, setIsCancelTripDialogOpen] = useState(false);
  const [tripToCancel, setTripToCancel] = useState<ReserveReport | null>(null);
  const [isCancellingTrip, setIsCancellingTrip] = useState(false);
  const [disabledPassengers, setDisabledPassengers] = useState<number[]>([]);

  const [isAddPaymentReserveModalOpen, setIsAddPaymentReserveModalOpen] = useState(false);

  const {
    loading: loadingReserves,
    data: dataReserves,
    error: errorReserve,
    fetch: fetchReserves,
  } = useApi<ReserveReport, string>(getReserves, {
    autoFetch: false,
  });

  const {
    loading: loadingPassengerReserve,
    data: dataPassengerReserves,
    error: errorPassengerReserve,
    fetch: fetchPassengerReserves,
  } = useApi<PassengerReserveReport, number>(getPassengerReserves, {
    autoFetch: false,
  });

  const {
    loading: loadingCashBox,
    data: dataCashBox,
    fetch: fetchCashBox,
  } = useApi<any, any, CashBox>(getCurrentCashBox, { autoFetch: false });

  // Use the new hook for sorting
  const {
    sortedItems: sortedPassengers,
    sortColumn,
    sortDirection,
    handleSort,
  } = useTableSort<PassengerReserveReport, PassengerSortColumn>(dataPassengerReserves?.Items, 'name', passengerSortFns);

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    if (selectedDate) fetchReserves(format(selectedDate, 'yyyyMMdd'));
    setSelectedTrip(null);
  }, [selectedDate]);

  const fetchFullTripDetails = async (tripId: number) => {
    try {
      const tripData = await getTripById(tripId);

      if (tripData) {
        setSelectedTrip((prev) => {
          if (!prev) return prev;

          // Use either TripId or ServiceId for matching
          const currentId = prev.TripId || (prev as any).ServiceId;
          if (currentId && Number(currentId) !== tripId) return prev;

          // Map properties defensively (handle PascalCase and camelCase)
          return {
            ...prev,
            TripId: tripId,
            Prices: tripData.Prices || (tripData as any).prices || [],
            RelevantCities: tripData.RelevantCities || (tripData as any).relevantCities || [],
          };
        });
      }
    } catch {
    }
  };

  useEffect(() => {
    if (!selectedTrip) return;

    // Try to get tripId from available fields (case insensitive check for common variants)
    const rawTripId = selectedTrip.TripId || (selectedTrip as any).ServiceId || (selectedTrip as any).tripId;
    const tripId = rawTripId ? Number(rawTripId) : null;

    // Fetch detailed trip info if we have an ID and missing data (RelevantCities)
    if (tripId && !selectedTrip.RelevantCities) {
      fetchFullTripDetails(tripId);
    }

    fetchPassengerReserves(selectedTrip.ReserveId);
    loadAllOptions();
    loadPaymentMethod();
  }, [selectedTrip]);

  useEffect(() => {
    if (isPaymentSummaryOpen) {
      fetchCashBox({});
    }
  }, [isPaymentSummaryOpen]);

  const loadPaymentMethod = async () => {
    const formatedDirections: SelectOption[] = Object.entries(PaymentMethod)
      .filter(([key, value]) => typeof value === 'number')
      .map(([key, value]) => ({
        id: value as number,
        value: value.toString(),
        label: key, // Si querés un texto más bonito, abajo te muestro cómo
      }));
    setPaymentMethod(formatedDirections);
  };

  const loadAllOptions = async () => {
    try {
      setIsOptionsLoading(true);
      setOptionsError(null);

      // Llamadas API (pueden ir en paralelo)
      const directionsResponse = await get<any, PagedResponse<Direction>>('/direction-report', {
        // TODO: Replace get with a typed service function
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'fecha',
        sortDescending: true,
        filters: {},
      });

      if (directionsResponse && directionsResponse.Items) {
        const formatedDirections: SelectOption[] = directionsResponse.Items.map((direction) => ({
          id: direction.DirectionId,
          value: direction.DirectionId.toString(),
          label: direction.Name,
        }));
        setDirections(formatedDirections);
      }
    } catch (error) {
      setOptionsError('Error al cargar las direcciones');
    } finally {
      setIsOptionsLoading(false);
    }
  };
  // Handle passenger checkbox change
  const handlePassengerReserveCheck = async (passenger: PassengerReserveReport, checked: boolean) => {
    // Evitar múltiples clics con cooldown de 10 segundos
    setDisabledPassengers((prev) => [...prev, passenger.PassengerId]);

    try {
      const updatePayload: PassengerReserveUpdate = {
        pickupLocationId: passenger.PickupLocationId,
        dropoffLocationId: passenger.DropoffLocationId,
        hasTraveled: checked,
      };
      const response = await put(`/passenger-reserve-update/${passenger.PassengerId}`, updatePayload);

      if (response) {
        toast({ title: 'Estado actualizado', description: 'El estado del pasajero ha sido actualizado.', variant: 'success' });
        if (selectedTrip) {
          fetchPassengerReserves(selectedTrip.ReserveId);
        }
      } else {
        toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Ocurrió un error al actualizar el estado.', variant: 'destructive' });
    } finally {
      // Remover del estado de deshabilitado después de 10 segundos
      setTimeout(() => {
        setDisabledPassengers((prev) => prev.filter((id) => id !== passenger.PassengerId));
      }, 10000);
    }
  };

  // Handle delete passenger
  const handleDeletePassengerReserveClick = (passenger: PassengerReserveReport) => {
    if (passenger) {
      setSelectedPassengerReserve(passenger);
      // setDeleteAction(passenger.paid ? 'favor' : 'delete');
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (action: DeleteAction) => {
    if (selectedPassengerReserve) {
      setIsDeleting(true);
      try {
        // You can use the 'action' variable here to call different backend endpoints if needed
        await deleteLogic(`/customer-reserve-delete/${selectedPassengerReserve.PassengerId}`);
        toast({ title: 'Pasajero eliminado', description: 'El pasajero ha sido eliminado de la reserva.', variant: 'success' });
        setIsDeleteModalOpen(false);
        setSelectedPassengerReserve(null);
        if (selectedTrip) {
          fetchPassengerReserves(selectedTrip.ReserveId);
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle add passenger-reserve
  const handleAddPassenger = () => {
    if (!selectedTrip) {
      toast({ title: 'Seleccione un viaje', description: 'Debe seleccionar un viaje para poder añadir una reserva.', variant: 'destructive' });
      return;
    }
    setIsAddReservationFlowOpen(true);
  };

  // Handle edit reserve
  const handleEditReserve = (selectedTrip?: ReserveReport) => {
    if (selectedTrip) {
      setIsReserveDialogOpen(true);
    }
  };

  const handleCancelTripClick = (trip: ReserveReport) => {
    setTripToCancel(trip);
    setIsCancelTripDialogOpen(true);
  };

  const handleConfirmCancelTrip = async () => {
    if (!tripToCancel) return;

    setIsCancellingTrip(true);
    try {
      const updatePayload: ReserveUpdate = {
        vehicleId: null,
        driverId: null,
        reserveDate: null,
        departureHour: null,
        status: ReserveStatusEnum.Cancelled,
      };
      const response = await put(`/reserve-update/${tripToCancel.ReserveId}`, updatePayload);

      if (response) {
        toast({ title: 'Viaje cancelado', description: 'El viaje ha sido cancelado exitosamente.', variant: 'success' });
        setIsCancelTripDialogOpen(false);
        setTripToCancel(null);
        if (selectedDate) fetchReserves(format(selectedDate, 'yyyyMMdd'));
        if (selectedTrip?.ReserveId === tripToCancel.ReserveId) {
          setSelectedTrip(null);
        }
      } else {
        toast({ title: 'Error', description: 'Error al cancelar el viaje.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Ocurrió un error al cancelar el viaje.', variant: 'destructive' });
    } finally {
      setIsCancellingTrip(false);
    }
  };

  const handleEditPassengerReserve = (passengerReserve: PassengerReserveReport) => {
    if (passengerReserve) {
      setSelectedPassengerReserve(passengerReserve);
      setIsEditPassengerReserveModalOpen(true);
    }
  };

  const handleAddPaymentPassengerReserve = (passengerReserve: PassengerReserveReport) => {
    if (passengerReserve) {
      setSelectedPassengerReserve(passengerReserve);
      setIsAddPaymentReserveModalOpen(true);
    }
  };

  // Format date for display
  const formatSelectedDate = () => {
    if (!selectedDate) return 'Sin fecha seleccionada';

    const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas"
        description="Supervisa salidas, pasajeros y cobros del dia desde una misma vista operativa"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" title="Imprimir" className="rounded-full border-sky-100 bg-white text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-blue-700">
              <PrinterIcon className="h-4 w-4" />
            </Button>

            {/* Vehicle selection button */}
            <Button
              variant="outline"
              size="icon"
              title="Editar reserva"
              onClick={() => handleEditReserve(selectedTrip ?? undefined)}
              className="rounded-full border-sky-100 bg-white text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-blue-700"
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              title="Resumen de pagos"
              onClick={() => setIsPaymentSummaryOpen(true)}
              className="rounded-full border-sky-100 bg-white text-slate-600 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-blue-700"
            >
              <DollarSignIcon className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddPassenger} className="rounded-full bg-blue-600 px-5 text-white shadow-sm hover:bg-blue-700">
              <TicketPlus className=" mr-2 h-6 w-6" />
              Agregar
            </Button>
          </div>
        }
      />
      <div className="grid w-full gap-4 md:grid-cols-[minmax(204px,244px)_minmax(0,1fr)]">
        <TripSelectionPanel
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedTrip={selectedTrip}
          onTripSelect={setSelectedTrip}
          onCancelTrip={handleCancelTripClick}
          trips={dataReserves?.Items}
          isLoading={loadingReserves}
        />

        <div className="min-w-0 space-y-4">
          <div className="rounded-[1.25rem] border border-blue-200 bg-[linear-gradient(180deg,rgba(222,238,255,0.98),rgba(206,227,251,0.96))] px-4 py-4 shadow-[0_14px_28px_rgba(37,99,235,0.10),inset_0_1px_0_rgba(255,255,255,0.78)]">
                <div className="mb-2 text-[11px] uppercase tracking-[0.26em] text-sky-700">manifiesto de pasajeros</div>
                <div className="flex items-center text-xl font-display text-slate-900">
                  <UserPlusIcon className="mr-2 h-5 w-5 text-blue-700" />
                {selectedDate
                  ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).charAt(0).toUpperCase() +
                  format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).slice(1)
                  : ''}{' '}
                - {selectedTrip?.OriginName} → {selectedTrip?.DestinationName}, {selectedTrip?.DepartureHour}
              </div>

              </div>

              <PassengerListTable
                passengers={sortedPassengers}
                isLoading={loadingPassengerReserve}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                onCheckPassenger={handlePassengerReserveCheck}
                onEdit={handleEditPassengerReserve}
                onDelete={handleDeletePassengerReserveClick}
                onAddPayment={handleAddPaymentPassengerReserve}
                getClientBalance={() => null} // Placeholder, implement if needed
                disabledPassengers={disabledPassengers}
              />
        </div>
      </div>

      <AddReservationFlow
        open={isAddReservationFlowOpen}
        onOpenChange={setIsAddReservationFlowOpen}
        onSuccess={() => {
          if (selectedTrip) {
            fetchPassengerReserves(selectedTrip.ReserveId);
          }
        }}
        initialTrip={selectedTrip}
        directions={directions}
        paymentMethods={paymentMethod}
        isLoadingOptions={isOptionsLoading}
        optionsError={optionsError}
      />

      <EditTripDialog
        open={isReserveDialogOpen}
        onOpenChange={setIsReserveDialogOpen}
        trip={selectedTrip}
        onSuccess={() => {
          if (selectedDate) fetchReserves(format(selectedDate, 'yyyyMMdd'));
        }}
      />
      <EditPassengerReserveDialog
        open={isEditPassengerReserveModalOpen}
        onOpenChange={setIsEditPassengerReserveModalOpen}
        passengerReserve={selectedPassengerReserve}
        onSuccess={() => fetchPassengerReserves(selectedTrip!.ReserveId)}
        directions={directions}
        relevantCities={selectedTrip?.RelevantCities || []}
        isLoadingDirections={isOptionsLoading}
      />
      <AddPaymentDialog
        open={isAddPaymentReserveModalOpen}
        onOpenChange={setIsAddPaymentReserveModalOpen}
        passengerReserve={selectedPassengerReserve}
        paymentMethodOptions={paymentMethod}
        onSuccess={() => fetchPassengerReserves(selectedTrip!.ReserveId)}
      />
      <DeleteConfirmationDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        passengerReserve={selectedPassengerReserve}
        onConfirm={handleConfirmDelete}
        isConfirming={isDeleting}
      />

      <CancelTripDialog open={isCancelTripDialogOpen} onOpenChange={setIsCancelTripDialogOpen} trip={tripToCancel} onConfirm={handleConfirmCancelTrip} isConfirming={isCancellingTrip} />

      <PaymentSummaryDialog
        open={isPaymentSummaryOpen}
        onOpenChange={setIsPaymentSummaryOpen}
        currentCashBox={dataCashBox as unknown as CashBox}
        loading={loadingCashBox}
        onSuccess={() => fetchCashBox({})}
      />
    </div>
  );
}
