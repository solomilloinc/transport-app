'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es, is } from 'date-fns/locale';
import { PrinterIcon, UserPlusIcon, DollarSignIcon, TicketPlus, Edit2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { ReserveReport, ReserveReportResponse } from '@/interfaces/reserve';
import { SelectOption } from '@/components/dashboard/select';
import { PassengerReserveReport, PassengerReserveUpdate } from '@/interfaces/passengerReserve';
import { PaymentStatusEnum } from '@/interfaces/passengerReserve';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { Direction } from '@/interfaces/direction';
import { useApi } from '@/hooks/use-api';
import { getPassengerReserves, getReserves, GetReservesParams } from '@/services/reserves';
import { cancelReserveTripAction, cancelPassengerAction } from '@/app/admin/reserves/actions';
import { PaymentMethod } from '@/interfaces/payment';
import { getTripById } from '@/services/trip';
import { EditPassengerReserveDialog } from '@/components/admin/reserves/EditPassengerReserveDialog';
import { AddReservationFlow } from '@/components/admin/reserves/AddReservationFlow';
import { CancelPassengerDialog, CancelPassengerPolicy } from '@/components/admin/reserves/CancelPassengerDialog';
import { PaymentSummaryDialog } from '@/components/admin/reserves/PaymentSummaryDialog';
import { useTableSort } from '@/hooks/use-table-sort';
import { PagedResponse } from '@/services/types';
import { getCurrentCashBox } from '@/services/cash-box';
import CashBox from '@/interfaces/cash-box';

// Funciones de ordenamiento para la tabla de pasajeros.
// Al no poner un tipo explícito, TypeScript infiere el tipo más específico,
// lo que resuelve el error de asignación en el hook `useTableSort`.
const passengerSortFns = {
  name: (a: PassengerReserveReport, b: PassengerReserveReport) => a.fullName.localeCompare(b.fullName),
  pickup: (a: PassengerReserveReport, b: PassengerReserveReport) => a.pickupLocationName.localeCompare(b.pickupLocationName),
  paid: (a: PassengerReserveReport, b: PassengerReserveReport) => a.statusPaymentId - b.statusPaymentId,
  paymentMethod: (a: PassengerReserveReport, b: PassengerReserveReport) => (a.paymentMethods || '').localeCompare(b.paymentMethods),
  paidAmount: (a: PassengerReserveReport, b: PassengerReserveReport) => Number(a.paidAmount) - Number(b.paidAmount),
};

export default function ReservationsPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [selectedTrip, setSelectedTrip] = useState<ReserveReport | null>(null);
  // Ruta (Trip) por la que se filtra el reporte del día. `null` = todas.
  const [selectedRuta, setSelectedRuta] = useState<number | null>(null);
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

  // Cancelar pasajero individual (acción por fila).
  const [isCancelPassengerOpen, setIsCancelPassengerOpen] = useState(false);
  const [passengerToCancel, setPassengerToCancel] = useState<PassengerReserveReport | null>(null);
  const [isCancellingPassenger, setIsCancellingPassenger] = useState(false);

  const {
    loading: loadingReserves,
    data: dataReserves,
    error: errorReserve,
    fetch: fetchReserves,
  } = useApi<ReserveReport, GetReservesParams, ReserveReportResponse>(getReserves, {
    autoFetch: false,
  });

  const {
    loading: loadingPassengerReserve,
    data: dataPassengerReserves,
    error: errorPassengerReserve,
    fetch: fetchPassengerReserves,
    reset: resetPassengerReserves,
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
  } = useTableSort<PassengerReserveReport, PassengerSortColumn>(dataPassengerReserves?.items, 'name', passengerSortFns);

  const visiblePassengers = useMemo(
    () =>
      (sortedPassengers ?? []).filter(
        (passenger) => passenger.status !== PaymentStatusEnum.Cancelled,
      ),
    [sortedPassengers],
  );

  const currentReservedQuantity = selectedTrip
    ? Math.max(selectedTrip.reservedQuantity, visiblePassengers.length)
    : 0;

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    // Al cambiar el día, las Rutas disponibles cambian: reseteamos el filtro.
    setSelectedRuta(null);
    setSelectedTrip(null);
    setSelectedPassengerReserve(null);
    resetPassengerReserves();
    if (selectedDate) fetchReserves({ date: format(selectedDate, 'yyyyMMdd'), tripId: null });
  }, [selectedDate]);

  // Filtro server-side por Ruta: re-fetch con `filters.tripId`. `availableTrips`
  // vuelve estable (se calcula sobre el día completo), así el Select no parpadea.
  const handleRutaChange = (tripId: number | null) => {
    setSelectedRuta(tripId);
    if (selectedDate) fetchReserves({ date: format(selectedDate, 'yyyyMMdd'), tripId });
  };

  const fetchFullTripDetails = async (tripId: number) => {
    try {
      const tripData = await getTripById(tripId);
      if (!tripData) return;

      setSelectedTrip((prev) => {
        if (!prev) return prev;
        if (prev.tripId && Number(prev.tripId) !== tripId) return prev;

        return {
          ...prev,
          tripId,
          prices: tripData.prices ?? [],
          relevantCities: tripData.relevantCities ?? [],
          pickupOptions: tripData.pickupOptions ?? [],
          dropoffOptionsIda: tripData.dropoffOptionsIda ?? [],
          dropoffOptionsIdaVuelta: tripData.dropoffOptionsIdaVuelta ?? [],
        };
      });
    } catch (error) {
      console.error('Error fetching full trip details:', error);
    }
  };

  useEffect(() => {
    if (!selectedTrip?.tripId) return;

    const needsTripDetails =
      !selectedTrip.relevantCities ||
      selectedTrip.relevantCities.length === 0 ||
      !selectedTrip.pickupOptions ||
      !selectedTrip.dropoffOptionsIda;

    if (needsTripDetails) {
      fetchFullTripDetails(Number(selectedTrip.tripId));
    }
  }, [
    selectedTrip?.tripId,
    selectedTrip?.relevantCities,
    selectedTrip?.pickupOptions,
    selectedTrip?.dropoffOptionsIda,
  ]);

  useEffect(() => {
    if (!selectedTrip?.reserveId) {
      resetPassengerReserves();
      return;
    }

    fetchPassengerReserves(selectedTrip.reserveId);
    loadAllOptions();
    loadPaymentMethod();
  }, [selectedTrip?.reserveId]);

  useEffect(() => {
    if (!selectedTrip) return;

    const currentTrips = dataReserves?.reserves?.items;

    if (!currentTrips) {
      return;
    }

    const refreshedTrip = currentTrips.find(
      (trip) => trip.reserveId === selectedTrip.reserveId,
    );

    if (!refreshedTrip) {
      setSelectedTrip(null);
      return;
    }

    if (refreshedTrip) {
      setSelectedTrip((current) => {
        if (!current || current.reserveId !== refreshedTrip.reserveId) {
          return current;
        }

        return {
          ...refreshedTrip,
          prices: current.prices ?? refreshedTrip.prices,
          relevantCities: current.relevantCities ?? refreshedTrip.relevantCities,
          pickupOptions: current.pickupOptions ?? refreshedTrip.pickupOptions,
          dropoffOptionsIda: current.dropoffOptionsIda ?? refreshedTrip.dropoffOptionsIda,
          dropoffOptionsIdaVuelta:
            current.dropoffOptionsIdaVuelta ?? refreshedTrip.dropoffOptionsIdaVuelta,
        };
      });
    }
  }, [dataReserves?.reserves?.items, selectedTrip?.reserveId]);

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

      if (directionsResponse && directionsResponse.items) {
        const formatedDirections: SelectOption[] = directionsResponse.items.map((direction) => ({
          id: direction.directionId,
          value: direction.directionId.toString(),
          label: direction.name,
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
    setDisabledPassengers((prev) => [...prev, passenger.passengerId]);

    try {
      const updatePayload: PassengerReserveUpdate = {
        pickupLocationId: passenger.pickupLocationId,
        dropoffLocationId: passenger.dropoffLocationId,
        hasTraveled: checked,
      };
      const response = await put(`/passenger-reserve-update/${passenger.passengerId}`, updatePayload);

      if (response) {
        toast({ title: 'Estado actualizado', description: 'El estado del pasajero ha sido actualizado.', variant: 'success' });
        if (selectedTrip) {
          fetchPassengerReserves(selectedTrip.reserveId);
        }
      } else {
        toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: getApiErrorMessage(error).message, variant: 'destructive' });
    } finally {
      // Remover del estado de deshabilitado después de 10 segundos
      setTimeout(() => {
        setDisabledPassengers((prev) => prev.filter((id) => id !== passenger.passengerId));
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
        await deleteLogic(`/customer-reserve-delete/${selectedPassengerReserve.passengerId}`);
        toast({ title: 'Pasajero eliminado', description: 'El pasajero ha sido eliminado de la reserva.', variant: 'success' });
        setIsDeleteModalOpen(false);
        setSelectedPassengerReserve(null);
        if (selectedTrip) {
          fetchPassengerReserves(selectedTrip.reserveId);
          if (selectedDate) {
            fetchReserves({ date: format(selectedDate, 'yyyyMMdd'), tripId: selectedRuta });
          }
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
      // El Server Action devuelve el error como valor (ver actions.ts): así el
      // código/copy del backend llega al usuario también en producción y un
      // error de validación no se convierte en un 500.
      const result = await cancelReserveTripAction(tripToCancel.reserveId);

      if (!result.ok) {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Viaje cancelado', description: 'El viaje ha sido cancelado exitosamente.', variant: 'success' });
      setIsCancelTripDialogOpen(false);
      setTripToCancel(null);
      if (selectedDate) fetchReserves({ date: format(selectedDate, 'yyyyMMdd'), tripId: selectedRuta });
      if (selectedTrip?.reserveId === tripToCancel.reserveId) {
        setSelectedTrip(null);
      }
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

  const handleCancelPassengerClick = (passenger: PassengerReserveReport) => {
    setPassengerToCancel(passenger);
    setIsCancelPassengerOpen(true);
  };

  const handleConfirmCancelPassenger = async (policy: CancelPassengerPolicy) => {
    if (!passengerToCancel) return;

    setIsCancellingPassenger(true);
    try {
      // Server Action que devuelve el error como valor (ver actions.ts): el
      // code/copy del backend llega al usuario también en producción.
      const result = await cancelPassengerAction(passengerToCancel.passengerId, {
        createCreditBalance: policy === 'credit',
      });

      if (!result.ok) {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Pasajero cancelado', description: 'El pasajero fue dado de baja.', variant: 'success' });
      setIsCancelPassengerOpen(false);
      setPassengerToCancel(null);
      // Refresca la grilla y el saldo del cliente (puede quedar a favor).
      if (selectedTrip) {
        fetchPassengerReserves(selectedTrip.reserveId);
        if (selectedDate) {
          fetchReserves({ date: format(selectedDate, 'yyyyMMdd'), tripId: selectedRuta });
        }
      }
    } finally {
      setIsCancellingPassenger(false);
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
    return format(selectedDate as Date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const isSelectedTripFull = selectedTrip
    ? currentReservedQuantity >= selectedTrip.availableQuantity
    : false;

  const isAddPassengerDisabled =
    !selectedTrip || selectedTrip.hasDeparted || isSelectedTripFull;

  const addPassengerButtonTitle = !selectedTrip
    ? 'Seleccioná un viaje para agregar pasajeros'
    : selectedTrip.hasDeparted
      ? 'No podés agregar pasajeros a un viaje que ya salió'
      : isSelectedTripFull
        ? 'El vehículo está completo'
        : 'Agregar pasajero';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas"
        description="Gestiona y visualiza todas las reservas de clientes"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" title="Imprimir">
              <PrinterIcon className="h-4 w-4" />
            </Button>

            {/* Vehicle selection button */}
            <Button variant="outline" size="icon" title="Editar reserva" onClick={() => handleEditReserve(selectedTrip ?? undefined)}>
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon" title="Resumen de pagos" onClick={() => setIsPaymentSummaryOpen(true)}>
              <DollarSignIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleAddPassenger}
              disabled={isAddPassengerDisabled}
              title={addPassengerButtonTitle}
            >
              <TicketPlus className=" mr-2 h-6 w-6" />
              Agregar
            </Button>
          </div>
        }
      />
      <div className="grid gap-2 md:grid-cols-[minmax(200px,250px)_1fr] w-full">
        <TripSelectionPanel
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedTrip={selectedTrip}
          onTripSelect={setSelectedTrip}
          onCancelTrip={handleCancelTripClick}
          trips={dataReserves?.reserves?.items}
          availableTrips={dataReserves?.availableTrips}
          selectedRuta={selectedRuta}
          onRutaChange={handleRutaChange}
          isLoading={loadingReserves}
        />

        {/* Passengers Card */}
        <Card className="w-full">
          <CardContent className="p-6 w-full">
            <div className="space-y-4">
              <div className="flex items-center text-xl font-semibold text-blue-500">
                <UserPlusIcon className="mr-2 h-5 w-5" />
                {selectedTrip
                  ? `${selectedDate
                    ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).charAt(0).toUpperCase() +
                      format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).slice(1)
                    : ''} - ${selectedTrip.originName} → ${selectedTrip.destinationName}, ${selectedTrip.departureHour}`
                  : 'Seleccioná un viaje para ver sus pasajeros'}
              </div>

              <PassengerListTable
                passengers={visiblePassengers}
                isLoading={loadingPassengerReserve}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                onCheckPassenger={handlePassengerReserveCheck}
                onEdit={handleEditPassengerReserve}
                onDelete={handleDeletePassengerReserveClick}
                onCancel={handleCancelPassengerClick}
                onAddPayment={handleAddPaymentPassengerReserve}
                getClientBalance={() => null} // Placeholder, implement if needed
                disabledPassengers={disabledPassengers}
                reserveHasDeparted={selectedTrip?.hasDeparted ?? false}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AddReservationFlow
        open={isAddReservationFlowOpen}
        onOpenChange={setIsAddReservationFlowOpen}
        onSuccess={() => {
          setSelectedTrip((current) =>
            current
              ? {
                  ...current,
                  reservedQuantity: Math.min(
                    current.availableQuantity,
                    current.reservedQuantity + 1,
                  ),
                }
              : current,
          );
          if (selectedTrip) {
            fetchPassengerReserves(selectedTrip.reserveId);
          }
          if (selectedDate) {
            fetchReserves({ date: format(selectedDate, 'yyyyMMdd'), tripId: selectedRuta });
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
          if (selectedDate) fetchReserves({ date: format(selectedDate, 'yyyyMMdd'), tripId: selectedRuta });
        }}
      />
      <EditPassengerReserveDialog
        open={isEditPassengerReserveModalOpen}
        onOpenChange={setIsEditPassengerReserveModalOpen}
        passengerReserve={selectedPassengerReserve}
        onSuccess={() => fetchPassengerReserves(selectedTrip!.reserveId)}
        pickupOptions={selectedTrip?.pickupOptions || []}
        dropoffOptions={selectedTrip?.dropoffOptionsIda || []}
        relevantCities={selectedTrip?.relevantCities || []}
        isLoadingDirections={isOptionsLoading}
      />
      <AddPaymentDialog
        open={isAddPaymentReserveModalOpen}
        onOpenChange={setIsAddPaymentReserveModalOpen}
        passengerReserve={selectedPassengerReserve}
        paymentMethodOptions={paymentMethod}
        onSuccess={() => fetchPassengerReserves(selectedTrip!.reserveId)}
      />
      <DeleteConfirmationDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        passengerReserve={selectedPassengerReserve}
        onConfirm={handleConfirmDelete}
        isConfirming={isDeleting}
      />

      <CancelTripDialog open={isCancelTripDialogOpen} onOpenChange={setIsCancelTripDialogOpen} trip={tripToCancel} onConfirm={handleConfirmCancelTrip} isConfirming={isCancellingTrip} />

      <CancelPassengerDialog
        open={isCancelPassengerOpen}
        onOpenChange={setIsCancelPassengerOpen}
        passenger={passengerToCancel}
        onConfirm={handleConfirmCancelPassenger}
        isConfirming={isCancellingPassenger}
      />


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
