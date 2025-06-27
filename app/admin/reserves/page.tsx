'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, set } from 'date-fns';
import { es, is, se } from 'date-fns/locale';
import {
  PrinterIcon,
  UserPlusIcon,
  TrashIcon,
  DollarSignIcon,
  PlusCircleIcon,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  TicketPlus,
  Edit2,
  CurrencyIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { PageHeader } from '@/components/dashboard/page-header';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { deleteLogic, get, post } from '@/services/api';
import { emptyEditReserve, Reserve, ReserveReport } from '@/interfaces/reserve';
import { PagedResponse, PaginationParams } from '@/services/types';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { emptyPassenger, Passenger } from '@/interfaces/passengers';
import { emptyPassengerCreate, PassengerReserveCreate, PassengerReserveReport } from '@/interfaces/passengerReserve';
import { Vehicle } from '@/interfaces/vehicle';
import { toast } from '@/hooks/use-toast';
import { Direction } from '@/interfaces/direction';
import { useFormValidation } from '@/hooks/use-form-validation';
import { Calendar } from '@/components/ui/calendar';
import { useApi } from '@/hooks/use-api';
import { usePaginationParams, withDefaultPagination } from '@/utils/pagination';
import { getPassengerReserves, getReserves } from '@/services/reserves';
import { validationConfigPassenger } from '@/validations/passengerSchema';
import { validationConfigEditReserve } from '@/validations/reserveSchema';
import { getPassengers } from '@/services/passenger';
import { emptyPaymentCreate, Payment, PaymentMethod } from '@/interfaces/payment';
import { validationConfigPayment } from '@/validations/paymentSchema';
import { reserveValidationSchema } from '@/validations/reservePassengerSchema';

// Add a helper function to get client balance before the ReservationsPage function
const getClientBalance = (dni: string) => {
  // const client = passe.find((c) => c.dni === dni);
  // if (!client) return null;
  // const balanceRecord = mockClientBalances.find((b) => b.clientId === client.id);
  // return balanceRecord ? balanceRecord.balance : null;
  return 1;
};

// Define the type for sort column
type SortColumn = 'name' | 'pickup' | 'dropoff' | 'paid' | 'paymentMethod' | 'price';
type SortDirection = 'asc' | 'desc';

// Define the type for delete action
type DeleteAction = 'delete' | 'favor' | 'debt';

export default function ReservationsPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [month, setMonth] = useState<Date>(new Date());
  // const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTrip, setSelectedTrip] = useState<ReserveReport | null>(null);
  const [selectedPassengerReserve, setSelectedPassengerReserve] = useState<PassengerReserveReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);

  // Add state for sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [isAddPassengerModalOpen, setIsAddPassengerModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [passengerToDelete, setPassengerToDelete] = useState<number | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction>('delete');
  const [isPaymentSummaryOpen, setIsPaymentSummaryOpen] = useState(false);
  const [isPassengerSelectorOpen, setIsPassengerSelectorOpen] = useState(false);
  const [isEditPassengerReserveModalOpen, setIsEditPassengerReserveModalOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  // Round-trip states
  const [isReturnTripModalOpen, setIsReturnTripModalOpen] = useState(false);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTrip, setReturnTrip] = useState<ReserveReport | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const reserveForm = useFormValidation(emptyPassengerCreate, reserveValidationSchema);

  const [passengerReserve, setPassengerReserve] = useState<PassengerReserveCreate[]>([]);

  const [directions, setDirections] = useState<SelectOption[]>([]);

  const addFormPassenger = useFormValidation(emptyPassenger, validationConfigPassenger);
  const editFormReserve = useFormValidation(emptyEditReserve, validationConfigEditReserve);
  const editPassengerReserve = useFormValidation(emptyPassengerCreate, validationConfigEditReserve);
  const addFormPayment = useFormValidation(emptyPaymentCreate, validationConfigPayment);

  const [paymentMethod, setPaymentMethod] = useState<SelectOption[]>([]);
  // Vehicle selection state
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Update the payment summary dialog to include custom payment entries
  // First, add a new state for custom payments
  const [customPayments, setCustomPayments] = useState<Array<{ name: string; method: string; amount: number }>>([]);
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('Efectivo');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');

  // Add this state variable for client search filtering
  // Add it near the other state variables at the top of the component
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

  const [isAddPaymentReserveModalOpen, setIsAddPaymentReserveModalOpen] = useState(false);

  // Add a new state for the selected payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [reservationPayments, setReservationPayments] = useState<Payment[]>([]);

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
    loading: loadingPassenger,
    data: dataPassenger,
    error: errorPassenger,
    fetch: fetchPassenger,
    reset: resetDataPassenger,
  } = useApi<Passenger, PaginationParams>(getPassengers, {
    autoFetch: false,
    params: { filters: { documentNumber: passengerSearchQuery } },
  });

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    fetchReserves(format(isRoundTrip ? (returnDate as Date) : (selectedDate as Date), 'yyyyMMdd'));
    setSelectedTrip(null);
  }, [selectedDate, returnDate]);

  useEffect(() => {
    if (!selectedTrip) return;
    fetchPassengerReserves(selectedTrip.ReserveId);
    loadAllOptions();
  }, [selectedTrip]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (passengerSearchQuery.length >= 3) {
        fetchPassenger({ filters: { documentNumber: passengerSearchQuery } });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [passengerSearchQuery]);

  const fetchVehicles = async () => {
    try {
      const response = await get<any, Vehicle>('/vehicle-report', {
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'name',
        sortDescending: false,
        filters: {},
      });
      if (response && response.Items) {
        const formattedVehicles: SelectOption[] = response.Items.map((vehicle) => ({
          id: vehicle.VehicleId,
          value: vehicle.VehicleId.toString(),
          label: `${vehicle.VehicleTypeName} (${vehicle.InternalNumber})`,
        }));
        setVehicles(formattedVehicles);
      }
    } catch (error) {
      setVehicles([]);
    }
  };

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
      const directionsResponse = await get<any, Direction>('/direction-report', {
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
    const updatedPassenger = { ...passenger, HasTraveled: checked };
    //aca hacer la llamada api
  };

  // Handle delete passenger
  const handleDeletePassengerReserveClick = (passenger: PassengerReserveReport) => {
    if (passenger) {
      setSelectedPassengerReserve(passenger);
      // setDeleteAction(passenger.paid ? 'favor' : 'delete');
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeletePassenger = async () => {
    if (selectedPassengerReserve) {
      const id = await deleteLogic(`/customer-reserve-delete/${selectedPassengerReserve.CustomerReserveId}`);
      setIsDeleteModalOpen(false);
      setSelectedPassengerReserve(null);
      if (!selectedTrip) return;
      fetchPassengerReserves(selectedTrip.ReserveId);
    }
  };

  // Handle add passenger-reserve
  const handleAddPassenger = () => {
    if (selectedTrip) {
      setSelectedPassenger(null);
      reserveForm.resetForm();
      setIsPassengerSelectorOpen(true);
    }
  };

  const submitAddReserve = () => {
    reserveForm.handleSubmit(async (data) => {
      const reserveData: PassengerReserveCreate = {
        ...reserveForm.data,
        ReserveId: returnTrip ? returnTrip?.ReserveId : selectedTrip?.ReserveId || 0,
        CustomerId: selectedPassenger?.CustomerId || 0,
        PickupLocationId: returnTrip ? Number(reserveForm.data.PickupLocationReturnId) || 0 : Number(reserveForm.data.PickupLocationId),
        DropoffLocationId: returnTrip ? Number(reserveForm.data.DropoffLocationReturnId) || 0 : Number(reserveForm.data.DropoffLocationId),
        Price: returnTrip
          ? returnTrip?.Prices.find((price) => price.ReserveTypeId === reserveForm.data.ReserveTypeId)?.Price || 0
          : selectedTrip?.Prices.find((price) => price.ReserveTypeId === reserveForm.data.ReserveTypeId)?.Price || 0,
      };

      setPassengerReserve([...passengerReserve, reserveData]);

      if (reserveData.ReserveTypeId === 1 && !returnTrip) {
        // Si es solo ida, guardamos el viaje y cerramos el modal
        setIsAddPassengerModalOpen(false);
        setIsPaymentFormOpen(true);
        return;
      }

      if (reserveData.ReserveTypeId === 2 && !returnTrip) {
        // Si es ida y vuelta, guardamos solo el viaje de ida y abrimos modal de regreso
        setReturnDate(today);
        setIsAddPassengerModalOpen(false);
        setIsReturnTripModalOpen(true);
        return;
      }

      if (reserveData.ReserveTypeId === 2 && returnTrip) {
        setIsReturnTripModalOpen(false);
        setIsPaymentFormOpen(true);
      }
    });
  };

  const finalizeAddReserve = async () => {
    reserveForm.handleSubmit(async () => {
      try {
        const response = await post('/passenger-reserves-create', {
          items: passengerReserve,
          payments: reservationPayments,
        });

        if (response) {
          toast({
            title: 'Reserva creada',
            description: 'La reserva ha sido creada exitosamente',
            variant: 'success',
          });
          fetchReserves(format(isRoundTrip ? (returnDate as Date) : (selectedDate as Date), 'yyyyMMdd'));
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear la reserva',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear la reserva',
          variant: 'destructive',
        });
      } finally {
        resetReservaForm();
        if (!selectedTrip) return;
        fetchPassengerReserves(selectedTrip.ReserveId);
      }
    });
  };

  const resetReservaForm = () => {
    setIsAddPassengerModalOpen(false);
    setIsReturnTripModalOpen(false);
    setPassengerReserve([]);
    setPassengerSearchQuery('');
    setSelectedPassenger(null);
    setReturnTrip(null);
    setIsRoundTrip(false);
    setIsPaymentFormOpen(false);
    reserveForm.resetForm();
  };

  const handleOpenChangePassengerModal = (open: boolean) => {
    setIsAddPassengerModalOpen(open);
    if (!open) {
      resetReservaForm();
    }
  };

  const handleOpenReturnTripModal = (open: boolean) => {
    setIsReturnTripModalOpen(open);
    if (!open) {
      resetReservaForm();
    }
  };

  const submitEditReserve = () => {
    editFormReserve.handleSubmit(async (data) => {
      try {
        const response = await post('/reserve-update', {
          ...selectedTrip,
          ...data,
        });

        if (response) {
          toast({
            title: 'Reserva actualizada',
            description: 'La reserva ha sido actualizada exitosamente',
            variant: 'success',
          });
          fetchReserves(format(isRoundTrip ? (returnDate as Date) : (selectedDate as Date), 'yyyyMMdd'));
          setIsAddPassengerModalOpen(false);
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar la reserva',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar la reserva',
          variant: 'destructive',
        });
      }
    });
  };

  const submitAddNewClient = () => {
    addFormPassenger.handleSubmit(async (data) => {
      try {
        const response = await post('/customer-create', data);
        if (response) {
          toast({
            title: 'Pasajero creado',
            description: 'El pasajero ha sido creado exitosamente',
            variant: 'success',
          });
          setSelectedPassenger({
            ...data,
            CustomerId: response,
          });
          setIsNewClientModalOpen(false);
          setIsAddPassengerModalOpen(true);
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el pasajero',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el pasajero',
          variant: 'destructive',
        });
      }
    });
  };

  // Handle edit reserve
  const handleEditReserve = (selectedTrip?: ReserveReport) => {
    if (selectedTrip) {
      editFormReserve.setField('VehicleId', selectedTrip.VehicleId);
      editFormReserve.setField('DepartureHour', selectedTrip.DepartureHour);
      setIsReserveDialogOpen(true);
      fetchVehicles();
    }
  };

  const handleEditPassengerReserve = (passengerReserve: PassengerReserveReport) => {
    if (passengerReserve) {
      setSelectedPassengerReserve(passengerReserve);
      editPassengerReserve.setField('PickupLocationId', passengerReserve.PickupLocationId);
      editPassengerReserve.setField('DropoffLocationId', passengerReserve.DropoffLocationId);
      setIsEditPassengerReserveModalOpen(true);
    }
  };

  const handleAddPaymentPassengerReserve = (passengerReserve: PassengerReserveReport) => {
    if (passengerReserve) {
      setSelectedPassengerReserve(passengerReserve);
      setIsAddPaymentReserveModalOpen(true);
    }
  };

  const handleAddReservationPayment = () => {
    if (Number(paymentAmount) > 0) {
      setReservationPayments([
        ...reservationPayments,
        {
          PaymentMethod: Number(selectedPaymentMethod),
          TransactionAmount: Number(paymentAmount),
        },
      ]);
      setSelectedPaymentMethod('1');
      setPaymentAmount('');
    }
  };

  const handleAddPayment = () => {
    setReservationPayments([
      ...reservationPayments,
      {
        PaymentMethod: Number(addFormPayment.data.PaymentMethod),
        TransactionAmount: Number(addFormPayment.data.TransactionAmount),
      },
    ]);
  };

  const submitEditPassengerReserve = () => {
    editPassengerReserve.handleSubmit(async (data) => {
      try {
        const response = await post('/customer-reserve-update', {
          ...data,
        });

        if (response) {
          toast({
            title: 'Reserva actualizada',
            description: 'La reserva ha sido actualizada exitosamente',
            variant: 'success',
          });
          fetchReserves(format(isRoundTrip ? (returnDate as Date) : (selectedDate as Date), 'yyyyMMdd'));
          setIsEditPassengerReserveModalOpen(false);
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar la reserva',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar la reserva',
          variant: 'destructive',
        });
      }
    });
  };

  const submitAddPaymentReserve = () => {
    addFormPayment.handleSubmit(async (data) => {
      try {
        const response = await post(`/reserve-create-payments/${selectedPassengerReserve?.ReserveId}/${selectedPassengerReserve?.CustomerId}`, data);
        if (response) {
          toast({
            title: 'Pago cargado',
            description: 'El pago ha sido cargado exitosamente',
            variant: 'success',
          });
          setReservationPayments([]);
          setIsAddPaymentReserveModalOpen(false);
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el pago',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el pago',
          variant: 'destructive',
        });
      }
    });
  };

  // Remove payment from reservation
  const handleRemoveReservationPayment = (index: number) => {
    setReservationPayments(reservationPayments.filter((_, i) => i !== index));
  };

  // Calculate total payment amount
  const getTotalPaymentAmount = () => {
    return reservationPayments.reduce((total, payment) => total + payment.TransactionAmount, 0);
  };

  // Format date for display
  const formatSelectedDate = () => {
    return format(selectedDate as Date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Format return date for display
  const formatReturnDate = () => {
    return format(returnDate as Date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Update the calculatePaymentTotals function to include the selected payment method
  const calculatePaymentTotals = () => {
    const totals = {
      Efectivo: 0,
      Método: 0,
      Total: 0,
      // Add a property to store custom payments total
      Custom: 0,
    };

    // passengers.forEach((passenger) => {
    //   if (passenger.checked && passenger.paid) {
    //     totals[passenger.paymentMethod as keyof typeof totals] += passenger.price;
    //     totals.Total += passenger.price;
    //   }
    // });

    // Add custom payments to the total
    customPayments.forEach((payment) => {
      totals.Custom += payment.amount;
      totals.Total += payment.amount;
    });

    return totals;
  };

  // Add a function to handle payment method change
  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  // Add a function to update passenger payment method
  // const updatePassengerPaymentMethod = () => {
  //   setPassengers(
  //     passengers.map((passenger) =>
  //       passenger.checked && passenger.paid ? { ...passenger, paymentMethod: selectedPaymentMethod } : passenger
  //     )
  //   );
  //   setIsPaymentSummaryOpen(false);
  // };

  // Add a function to handle adding new custom payments
  const handleAddCustomPayment = () => {
    if (newPaymentName.trim() && Number(newPaymentAmount) > 0) {
      setCustomPayments([
        ...customPayments,
        {
          name: newPaymentName.trim(),
          method: newPaymentMethod,
          amount: Number(newPaymentAmount),
        },
      ]);
      setNewPaymentName('');
      setNewPaymentMethod('Efectivo');
      setNewPaymentAmount('');
    }
  };

  // Add a function to handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort passengers based on current sort settings
  // const sortedPassengers = [...passengers].sort((a, b) => {
  //   let comparison = 0;

  //   // Compare based on the selected column
  //   switch (sortColumn) {
  //     case 'name':
  //       comparison = a.name.localeCompare(b.name);
  //       break;
  //     case 'pickup':
  //       comparison = a.pickup.localeCompare(b.pickup);
  //       break;
  //     case 'dropoff':
  //       comparison = a.dropoff.localeCompare(b.dropoff);
  //       break;
  //     case 'paid':
  //       comparison = Number(a.paid) - Number(b.paid);
  //       break;
  //     case 'paymentMethod':
  //       comparison = a.paymentMethod.localeCompare(b.paymentMethod);
  //       break;
  //     case 'price':
  //       comparison = a.price - b.price;
  //       break;
  //   }

  //   // Reverse if descending
  //   return sortDirection === 'asc' ? comparison : -comparison;
  // });

  // Helper function to render sort indicator
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
    }

    return sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4 inline" /> : <ChevronDown className="ml-1 h-4 w-4 inline" />;
  };

  // Get passenger to delete for the dialog
  // const getPassengerToDelete = () => {
  //   return passengerToDelete ? passengers.find((p) => p.id === passengerToDelete) : null;
  // };

  // Handle return trip selection
  const handleReturnTripSelect = (trip: ReserveReport) => {
    setReturnTrip(trip);
  };

  // Handle price input change
  const handlePriceChange = (id: number, value: string) => {
    const newPrice = value === '' ? 0 : Number.parseInt(value.replace(/\D/g, ''));
    // setPassengers(passengers.map((p) => (p.id === id ? { ...p, price: newPrice } : p)));
  };

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
            <Button onClick={handleAddPassenger}>
              <TicketPlus className=" mr-2 h-6 w-6" />
              Añadir Reserva
            </Button>
          </div>
        }
      />
      <div className="grid gap-2 md:grid-cols-[minmax(200px,250px)_1fr] w-full">
        {/* Calendar Card */}
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="space-y-2">
              <div className="w-full max-w-full sm:max-w-[300px] mx-auto">
                <Calendar
                  className="text-xs sm:text-sm" // tamaño de fuente responsivo
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={month}
                  onMonthChange={setMonth}
                  locale={es}
                  fromMonth={new Date()}
                  classNames={{
                    cell: 'h-6 w-6 sm:h-7 sm:w-7 text-center text-[10px] sm:text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-6 w-6 sm:h-7 sm:w-7 p-0 font-normal text-[10px] sm:text-xs aria-selected:opacity-100',
                    head_cell: 'text-muted-foreground rounded-md w-6 sm:w-7 font-normal text-[10px] sm:text-xs',
                  }}
                />
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-medium text-blue-500">Viajes {format(selectedDate as Date, 'd MMM', { locale: es })}</div>
                  {/* <div className="flex items-center">
                    <FilterIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <Select value={originFilter} onValueChange={setOriginFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Filtrar origen" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueOrigins.map((origin) => (
                          <SelectItem key={origin} value={origin}>
                            {origin === 'all' ? 'Todos los orígenes' : origin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}
                </div>
                <div className="space-y-2">
                  {dataReserves?.Items?.map((trip) => {
                    return (
                      <button
                        key={trip.ReserveId}
                        className={`flex w-full items-center gap-2 justify-between rounded-md border p-3 text-left text-sm ${
                          selectedTrip?.ReserveId === trip.ReserveId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTrip(trip)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-medium">{trip.DepartureHour}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-md ${
                              trip.ReservedQuantity >= trip.AvailableQuantity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {trip.ReservedQuantity}/{trip.AvailableQuantity}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {trip.OriginName} → {trip.DestinationName}
                        </div>
                      </button>
                    );
                  })}

                  {dataReserves?.Items?.length === 0 && (
                    <div className="text-center py-4 text-gray-500">No hay viajes disponibles con el origen seleccionado.</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passengers Card */}
        <Card className="w-full">
          <CardContent className="p-6 w-full">
            <div className="space-y-4">
              <div className="flex items-center text-xl font-semibold text-blue-500">
                <UserPlusIcon className="mr-2 h-5 w-5" />
                {formatSelectedDate().charAt(0).toUpperCase() + formatSelectedDate().slice(1)} - {selectedTrip?.OriginName} →{' '}
                {selectedTrip?.DestinationName}, {selectedTrip?.DepartureHour}
                {selectedVehicle && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    | Vehículo: {selectedVehicle.VehicleTypeName} ({selectedVehicle.InternalNumber})
                  </span>
                )}
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-gray-500">
                      <th className="py-3 pr-4 w-[20%]">
                        <button className="flex items-center font-medium text-gray-500 hover:text-gray-700" onClick={() => handleSort('name')}>
                          Pasajero {renderSortIndicator('name')}
                        </button>
                      </th>
                      <th className="py-3 pr-4 w-[20%]">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('pickup')}
                        >
                          Subida {renderSortIndicator('pickup')}
                        </button>
                      </th>
                      {/* <th className="py-3 pr-4 w-[20%]">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('dropoff')}
                        >
                          Bajada {renderSortIndicator('dropoff')}
                        </button>
                      </th> */}
                      <th className="py-3 pr-4 text-center">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('paid')}
                        >
                          Pagado {renderSortIndicator('paid')}
                        </button>
                      </th>
                      <th className="py-3 pr-4 w-[15%]">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('paymentMethod')}
                        >
                          Medio de pago {renderSortIndicator('paymentMethod')}
                        </button>
                      </th>
                      <th className="py-3 pr-4 text-center w-[10%]">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('price')}
                        >
                          Monto {renderSortIndicator('price')}
                        </button>
                      </th>
                      <th className="py-3 pl-4 text-right w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPassengerReserves?.Items?.map((passenger) => (
                      <tr key={passenger.CustomerReserveId} className="border-b">
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <Checkbox
                              id={`passenger-${passenger.CustomerId}`}
                              checked={passenger.HasTraveled}
                              onCheckedChange={(checked) => handlePassengerReserveCheck(passenger, checked as boolean)}
                              className="mr-2"
                            />
                            <div>
                              <label htmlFor={`passenger-${passenger.CustomerReserveId}`} className="font-medium">
                                {passenger.FullName}
                              </label>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>DNI: {passenger.DocumentNumber}</span>
                                {passenger.DocumentNumber && getClientBalance(passenger.DocumentNumber) !== null && (
                                  <span
                                    className={
                                      getClientBalance(passenger.DocumentNumber)! < 0 ? 'text-red-500 font-medium' : 'text-green-600 font-medium'
                                    }
                                  >
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
                          {/* <Select defaultValue={passenger.PickupLocationId.toString()}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {directions.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select> */}
                        </td>
                        {/* <td className="py-3 pr-4 text-center">
                          <Select defaultValue={passenger.DropoffLocationId.toString()}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {directions.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td> */}
                        <td className="py-3 pr-4 text-center">
                          <Checkbox id={`paid-${passenger.CustomerReserveId}`} checked={passenger.IsPayment} className="mx-auto" />
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {/* <Select defaultValue={passenger.PaymentMethod.toString()} disabled={!passenger.IsPayment}>
                            <SelectTrigger
                              className={`w-full ${!passenger.IsPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Efectivo">Efectivo</SelectItem>
                              <SelectItem value="Método">Método</SelectItem>
                            </SelectContent>
                          </Select> */}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Input
                            type="text"
                            value={passenger.Price}
                            onChange={(e) => handlePriceChange(passenger.CustomerReserveId, e.target.value)}
                            className={`w-24 text-right font-mono mx-auto ${!passenger.IsPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!passenger.IsPayment}
                          />
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => handleAddPaymentPassengerReserve(passenger)}
                            disabled={!passenger.IsPayment}
                          >
                            <CurrencyIcon className="h-4 w-4" />
                          </Button>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => handleEditPassengerReserve(passenger)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeletePassengerReserveClick(passenger)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Selector Dialog */}
      <Dialog open={isPassengerSelectorOpen} onOpenChange={setIsPassengerSelectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Pasajero</DialogTitle>
            <DialogDescription>Selecciona un pasajero existente o crea uno nuevo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="client-search">Buscar pasajero</Label>
              <Input
                id="client-search"
                placeholder="Buscar por nombre o DNI..."
                className="mb-2"
                value={passengerSearchQuery}
                onChange={(e) => setPassengerSearchQuery(e.target.value)}
              />
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {dataPassenger?.Items?.map((passenger) => (
                  <div
                    key={passenger.CustomerId}
                    className="flex items-center justify-between p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setSelectedPassenger(passenger);
                      setIsPassengerSelectorOpen(false);
                      setIsAddPassengerModalOpen(true);
                      setPassengerSearchQuery('');
                      resetDataPassenger();
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {passenger.FirstName} {passenger.LastName}
                      </span>
                      <span className="text-xs text-gray-500">DNI: {passenger.DocumentNumber}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Seleccionar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsPassengerSelectorOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setIsPassengerSelectorOpen(false);
                setIsNewClientModalOpen(true);
              }}
            >
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reserve */}
      <FormDialog
        open={isReserveDialogOpen}
        onOpenChange={setIsReserveDialogOpen}
        title="Editar reserva"
        description="Realiza cambios en los detalles de la reserva a continuación."
        onSubmit={() => submitEditReserve()}
        submitText="Guardar Cambios"
        isLoading={editFormReserve.isSubmitting}
      >
        <FormField label="Vehiculo" required error={editFormReserve.errors.VehicleId}>
          <ApiSelect
            value={String(editFormReserve.data.VehicleId)}
            onValueChange={(value) => editFormReserve.setField('VehicleId', Number(value))}
            placeholder="Seleccionar vehiculo"
            options={vehicles}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando vehiculos..."
            errorMessage="Error al cargar los vehiculos"
            emptyMessage="No hay vehiculos disponibles"
          />
        </FormField>
        <FormField label="Hora de partida" required error={editFormReserve.errors.DepartureHour}>
          <Input
            id="departure-hour"
            type="text"
            placeholder="Hora de partida"
            value={editFormReserve.data.DepartureHour}
            onChange={(e) => editFormReserve.setField('DepartureHour', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* New Client Modal */}
      <FormDialog
        open={isNewClientModalOpen}
        onOpenChange={setIsNewClientModalOpen}
        title="Añadir Nuevo Cliente"
        description="Crea un nuevo cliente completando el formulario a continuación"
        onSubmit={submitAddNewClient}
        submitText="Crear Cliente"
        isLoading={addFormPassenger.isSubmitting}
      >
        <FormField label="Nombre" required error={addFormPassenger.errors.FirstName}>
          <Input
            id="first-name"
            value={addFormPassenger.data.FirstName}
            type="text"
            placeholder="Nombre"
            onChange={(e) => addFormPassenger.setField('FirstName', e.target.value)}
          />
        </FormField>
        <FormField label="Apellido" required error={addFormPassenger.errors.LastName}>
          <Input
            id="last-name"
            value={addFormPassenger.data.LastName}
            placeholder="Apellido"
            type="text"
            onChange={(e) => addFormPassenger.setField('LastName', e.target.value)}
          />
        </FormField>
        <FormField label="Email" required error={addFormPassenger.errors.Email}>
          <Input id="email" value={addFormPassenger.data.Email} onChange={(e) => addFormPassenger.setField('Email', e.target.value)} />
        </FormField>
        <FormField label="Número de documento" required error={addFormPassenger.errors.DocumentNumber}>
          <Input
            id="documentNumber"
            value={addFormPassenger.data.DocumentNumber}
            placeholder="Número de documento"
            type="number"
            onChange={(e) => addFormPassenger.setField('DocumentNumber', e.target.value)}
          />
        </FormField>
        <FormField label="Teléfono 1" required error={addFormPassenger.errors.Phone1}>
          <Input id="phone1" value={addFormPassenger.data.Phone1} onChange={(e) => addFormPassenger.setField('Phone1', e.target.value)} />
        </FormField>
        <FormField label="Teléfono 2">
          <Input id="phone2" value={addFormPassenger.data.Phone2} onChange={(e) => addFormPassenger.setField('Phone2', e.target.value)} />
        </FormField>
      </FormDialog>

      {/* Add Reserve Modal */}
      <FormDialog
        open={isAddPassengerModalOpen}
        onOpenChange={handleOpenChangePassengerModal}
        title="Añadir Pasajero al Viaje"
        description={
          selectedPassenger
            ? `Añadiendo a ${selectedPassenger.FirstName} ${selectedPassenger.LastName} (DNI: ${selectedPassenger.DocumentNumber})`
            : 'Añade un nuevo pasajero a este viaje'
        }
        onSubmit={() => submitAddReserve()}
        submitText="Añadir Reserva"
        isLoading={reserveForm.isSubmitting}
      >
        <FormField label="Dirección de subida" required error={reserveForm.errors.PickupLocationId}>
          <ApiSelect
            value={String(reserveForm.data.PickupLocationId)}
            onValueChange={(value) => reserveForm.setField('PickupLocationId', Number(value))}
            placeholder="Seleccionar dirección de subida"
            options={directions}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando direcciones..."
            errorMessage="Error al cargar las direcciones"
            emptyMessage="No hay direcciones disponibles"
          />
        </FormField>
        <FormField label="Dirección de Bajada" required error={reserveForm.errors.DropoffLocationId}>
          <ApiSelect
            value={String(reserveForm.data.DropoffLocationId)}
            onValueChange={(value) => reserveForm.setField('DropoffLocationId', Number(value))}
            placeholder="Seleccionar dirección de bajada"
            options={directions}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando direcciones..."
            errorMessage="Error al cargar las direcciones"
            emptyMessage="No hay direcciones disponibles"
          />
        </FormField>
        <FormField label="Ida y Vuelta">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="round-trip"
              checked={reserveForm.data.ReserveTypeId === 2}
              onCheckedChange={(checked) => {
                setIsRoundTrip(checked as boolean);
                reserveForm.setField('ReserveTypeId', checked ? 2 : 1);
              }}
            />
            <Label htmlFor="round-trip" className="text-sm font-normal">
              Reservar viaje de ida y vuelta
            </Label>
          </div>
        </FormField>
      </FormDialog>

      {/* Return Trip Selection Dialog */}
      <FormDialog
        open={isReturnTripModalOpen}
        onOpenChange={handleOpenReturnTripModal}
        title="Seleccionar Viaje de Vuelta"
        description={`Selecciona la fecha y el servicio para el viaje de vuelta de ${
          selectedPassenger ? `${selectedPassenger.FirstName} ${selectedPassenger.LastName}` : 'el pasajero'
        }`}
        onSubmit={submitAddReserve}
        submitText="Añadir Reserva"
        isLoading={reserveForm.isSubmitting}
      >
        <div className="py-4">
          {/* Grid layout with calendar on left, trips on right */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left column - Return Calendar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Fecha de vuelta</div>
              </div>
              <Calendar
                className="text-xs sm:text-sm"
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                month={month}
                onMonthChange={setMonth}
                locale={es}
                fromMonth={new Date()}
                classNames={{
                  cell: 'h-6 w-6 sm:h-7 sm:w-7 text-center text-[10px] sm:text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                  day: 'h-6 w-6 sm:h-7 sm:w-7 p-0 font-normal text-[10px] sm:text-xs aria-selected:opacity-100',
                  head_cell: 'text-muted-foreground rounded-md w-6 sm:w-7 font-normal text-[10px] sm:text-xs',
                }}
              />
            </div>

            {/* Right column - Return Trip Selection */}
            <div className="border-l pl-4">
              {returnDate && (
                <>
                  <div className="font-medium mb-2">Viajes disponibles para {format(returnDate, "d 'de' MMMM", { locale: es })}</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-4">
                    {/* For simplicity, we're using the same trips, but in a real app you'd fetch trips for the return date */}
                    {dataReserves?.Items?.map((trip) => (
                      <button
                        key={trip.ReserveId}
                        className={`flex w-full items-center gap-2 justify-between rounded-md border p-3 text-left text-sm ${
                          returnTrip?.ReserveId === trip.ReserveId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleReturnTripSelect(trip)}
                      >
                        <div className="font-medium">{trip.DepartureHour}</div>
                        <div className="text-gray-600">
                          {trip.OriginName} → {trip.DestinationName}
                        </div>
                      </button>
                    ))}
                    {dataReserves?.Items?.length === 0 && (
                      <div className="text-center py-4 text-gray-500">No hay viajes disponibles con el origen seleccionado.</div>
                    )}
                  </div>
                </>
              )}
              {/* Add pickup and dropoff dropdowns */}
              <div className="space-y-3 mt-4">
                <div>
                  <FormField label="Dirección de subida" error={reserveForm.errors.PickupLocationReturnId}>
                    <ApiSelect
                      value={String(reserveForm.data.PickupLocationReturnId)}
                      onValueChange={(value) => reserveForm.setField('PickupLocationReturnId', value)}
                      placeholder="Seleccionar dirección de subida"
                      options={directions}
                      loading={isOptionsLoading}
                      error={optionsError}
                      loadingMessage="Cargando direcciones..."
                      errorMessage="Error al cargar las direcciones"
                      emptyMessage="No hay direcciones disponibles"
                    />
                  </FormField>
                </div>

                <div>
                  <FormField label="Dirección de bajada" error={reserveForm.errors.DropoffLocationReturnId}>
                    <ApiSelect
                      value={String(reserveForm.data.DropoffLocationReturnId)}
                      onValueChange={(value) => reserveForm.setField('DropoffLocationReturnId', value)}
                      placeholder="Seleccionar dirección de subida"
                      options={directions}
                      loading={isOptionsLoading}
                      error={optionsError}
                      loadingMessage="Cargando direcciones..."
                      errorMessage="Error al cargar las direcciones"
                      emptyMessage="No hay direcciones disponibles"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormDialog>
      {/* Payment Summary Dialog */}
      <FormDialog
        open={isPaymentFormOpen}
        onOpenChange={handleOpenChangePassengerModal}
        title="Confirmar reserva y pago"
        description={'Revisa los datos de la reserva y configura el pago'}
        onSubmit={() => finalizeAddReserve()}
        submitText="Confirmar Reserva"
        isLoading={reserveForm.isSubmitting}
      >
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6 py-4">
            {/* Reservation Summary */}
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="font-semibold text-lg mb-3">Resumen de la Reserva</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Pasajero:</span>
                  <p>
                    {selectedPassenger?.FirstName} {selectedPassenger?.LastName}
                  </p>
                  {selectedPassenger && <p className="text-gray-500">DNI: {selectedPassenger.DocumentNumber}</p>}
                </div>

                <div>
                  <span className="font-medium">Fecha:</span>
                  <p>{formatSelectedDate()}</p>
                </div>

                <div>
                  <span className="font-medium">Viaje de Ida</span>
                  <p>
                    {selectedTrip?.DepartureHour} - {selectedTrip?.OriginName} → {selectedTrip?.DestinationName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Subida: {directions.find((d) => d.id == reserveForm.data.PickupLocationId)?.label} | Bajada:{' '}
                    {directions.find((d) => d.id == reserveForm.data.DropoffLocationId)?.label}
                  </p>
                </div>

                {isRoundTrip && returnTrip && (
                  <div>
                    <span className="font-medium">Viaje de Vuelta:</span>
                    <p>
                      {returnTrip?.DepartureHour} - {returnTrip.OriginName} → {returnTrip.DestinationName}
                    </p>
                    <p className="text-sm text-gray-500">Fecha: {formatReturnDate()}</p>
                    <p className="text-sm text-gray-500">
                      Subida: {directions.find((d) => d.id == reserveForm.data.PickupLocationReturnId)?.label} | Bajada:{' '}
                      {directions.find((d) => d.id == reserveForm.data.DropoffLocationReturnId)?.label}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="payment-enabled"
                  checked={reserveForm.data.IsPayment}
                  onCheckedChange={(checked) => {
                    reserveForm.setField('IsPayment', checked);
                  }}
                />
                <Label htmlFor="payment-enabled" className="text-sm font-medium">
                  Registrar pago con la reserva
                </Label>
              </div>
              {reserveForm.data.IsPayment && (
                <>
                  <h3 className="font-semibold text-lg mb-3">Configurar Pagos</h3>

                  {/* Add Payment Form */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                      <Label htmlFor="payment-method" className="text-sm font-medium mb-1 block">
                        Método de Pago
                      </Label>
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger id="payment-method">
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Efectivo</SelectItem>
                          <SelectItem value="2">Método</SelectItem>
                          <SelectItem value="3">Transferencia</SelectItem>
                          <SelectItem value="4">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <Label htmlFor="payment-amount" className="text-sm font-medium mb-1 block">
                        Monto
                      </Label>
                      <div className="flex gap-1">
                        <Input
                          id="payment-amount"
                          type="number"
                          placeholder="Monto"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="icon" onClick={handleAddReservationPayment} disabled={!paymentAmount || Number(paymentAmount) <= 0}>
                          <PlusCircleIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Payment List */}
                  {reservationPayments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <Label className="text-sm font-medium">Pagos Agregados:</Label>
                      <div className="max-h-32 overflow-y-auto">
                        {reservationPayments.map((payment, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{payment.PaymentMethod}</span>
                              <span className="text-sm font-medium">${payment.TransactionAmount.toLocaleString()}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:bg-red-50"
                              onClick={() => handleRemoveReservationPayment(index)}
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">${getTotalPaymentAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Edit Passenger Reserve */}
      <FormDialog
        open={isEditPassengerReserveModalOpen}
        onOpenChange={setIsEditPassengerReserveModalOpen}
        title="Editar Reserva"
        description={`Edita los detalles de la reserva de ${selectedPassengerReserve?.FullName}`}
        onSubmit={submitEditPassengerReserve}
        submitText={`Edita los detalles de la reserva de ${selectedPassengerReserve?.FullName}`}
        isLoading={editPassengerReserve.isSubmitting}
      >
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Passenger Info */}
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="font-semibold text-lg mb-3">Información del Pasajero</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span>
                  <p>{selectedPassengerReserve?.FullName}</p>
                </div>
                <div>
                  <span className="font-medium">DNI:</span>
                  <p>{selectedPassengerReserve?.DocumentNumber}</p>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-lg mb-3">Detalles del Viaje</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormField label="Dirección de subida" required error={editPassengerReserve.errors.PickupLocationId}>
                      <ApiSelect
                        value={String(editPassengerReserve.data.PickupLocationId)}
                        onValueChange={(value) => editPassengerReserve.setField('PickupLocationId', Number(value))}
                        placeholder="Seleccionar dirección de subida"
                        options={directions}
                        loading={isOptionsLoading}
                        error={optionsError}
                        loadingMessage="Cargando direcciones..."
                        errorMessage="Error al cargar las direcciones"
                        emptyMessage="No hay direcciones disponibles"
                      />
                    </FormField>
                  </div>
                  <div>
                    <FormField label="Dirección de Bajada" required error={editPassengerReserve.errors.DropoffLocationId}>
                      <ApiSelect
                        value={String(editPassengerReserve.data.DropoffLocationId)}
                        onValueChange={(value) => editPassengerReserve.setField('DropoffLocationId', Number(value))}
                        placeholder="Seleccionar dirección de bajada"
                        options={directions}
                        loading={isOptionsLoading}
                        error={optionsError}
                        loadingMessage="Cargando direcciones..."
                        errorMessage="Error al cargar las direcciones"
                        emptyMessage="No hay direcciones disponibles"
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Add Payment Customer Reserve*/}
      <FormDialog
        open={isAddPaymentReserveModalOpen}
        onOpenChange={setIsAddPaymentReserveModalOpen}
        title="Agregar pago"
        description={`Agrega pago de la reserva de ${selectedPassengerReserve?.FullName}`}
        onSubmit={submitAddPaymentReserve}
        submitText="Agrega pago"
        isLoading={addFormPayment.isSubmitting}
      >
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Passenger Info */}
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="font-semibold text-lg mb-3">Información del Pasajero</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span>
                  <p>{selectedPassengerReserve?.FullName}</p>
                </div>
                <div>
                  <span className="font-medium">DNI:</span>
                  <p>{selectedPassengerReserve?.DocumentNumber}</p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-lg mb-3">Gestión de Pagos</h3>

              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <FormField label="Medio de pago" required error={addFormPayment.errors.PaymentMethod}>
                    <ApiSelect
                      value={String(addFormPayment.data.PaymentMethod)}
                      onValueChange={(value) => addFormPayment.setField('PaymentMethod', Number(value))}
                      placeholder="Seleccionar medio de pago"
                      options={paymentMethod}
                      loading={isOptionsLoading}
                      error={optionsError}
                      loadingMessage="Cargando medios de pago..."
                      errorMessage="Error al medios de pago"
                      emptyMessage="No hay medios de pago disponibles"
                    />
                  </FormField>
                </div>

                <div className="flex-1">
                  <div className="flex gap-1">
                    <FormField label="Monto">
                      <Input
                        id="monto"
                        value={addFormPayment.data.TransactionAmount}
                        onChange={(e) => addFormPayment.setField('TransactionAmount', e.target.value)}
                      />
                    </FormField>
                    <Button size="icon" onClick={handleAddPayment} disabled={Number(addFormPayment.data.TransactionAmount) <= 0}>
                      <PlusCircleIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Payment List */}
              {reservationPayments.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Label className="text-sm font-medium">Pagos Registrados:</Label>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                    <div className="space-y-2">
                      {reservationPayments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{payment.PaymentMethod}</span>
                            <span className="text-sm font-medium">${payment.TransactionAmount.toLocaleString()}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:bg-red-50"
                            onClick={() => handleRemoveReservationPayment(index)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Total Pagos:</span>
                    <span className="font-bold text-lg">${getTotalPaymentAmount().toLocaleString()}</span>
                  </div>
                </div>
              )}

              {reservationPayments.length === 0 && (
                <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded">No hay pagos registrados para esta reserva.</div>
              )}
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Custom Delete Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Pasajero</DialogTitle>
            <DialogDescription>
              {selectedPassengerReserve?.IsPayment
                ? 'Este pasajero ya ha pagado. ¿Qué deseas hacer con el pago?'
                : 'Este pasajero no ha pagado. ¿Qué deseas hacer?'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup value={deleteAction} onValueChange={(value) => setDeleteAction(value as DeleteAction)} className="space-y-3">
              {selectedPassengerReserve?.IsPayment ? (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delete" id="delete" />
                    <Label htmlFor="delete">Eliminar sin guardar el pago</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="favor" id="favor" />
                    <Label htmlFor="favor">Poner el dinero a favor del pasajero</Label>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delete" id="delete" />
                    <Label htmlFor="delete">Eliminar sin registrar deuda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="debt" id="debt" />
                    <Label htmlFor="debt">Registrar como deuda</Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => confirmDeletePassenger()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Summary Dialog */}
      <Dialog open={isPaymentSummaryOpen} onOpenChange={setIsPaymentSummaryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resumen de Pagos</DialogTitle>
            <DialogDescription>
              Resumen de pagos para {formatSelectedDate()} - {selectedTrip?.DepartureHour}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-500">Efectivo</div>
                <div className="text-2xl font-bold text-blue-500">${calculatePaymentTotals().Efectivo.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-500">Método</div>
                <div className="text-2xl font-bold text-blue-500">${calculatePaymentTotals().Método.toLocaleString()}</div>
              </div>
            </div>

            {/* Custom payments section */}
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-500">Otros Pagos</div>
                <div className="text-lg font-bold text-blue-500">${calculatePaymentTotals().Custom.toLocaleString()}</div>
              </div>

              {/* List of custom payments */}
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {customPayments.map((payment, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="w-3/5">{payment.name}</span>
                    <span className="w-1/5 text-center text-gray-500">{payment.method}</span>
                    <span className="w-1/5 text-right font-medium">${payment.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Add new custom payment */}
              <div className="flex gap-2 mt-2">
                <div className="w-3/5">
                  <Input placeholder="Nombre" value={newPaymentName} onChange={(e) => setNewPaymentName(e.target.value)} className="w-full" />
                </div>
                <div className="w-1/5">
                  <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Método">Método</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/5 flex gap-1">
                  <Input
                    placeholder="Monto"
                    type="number"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    className="w-full"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddCustomPayment}
                    disabled={!newPaymentName.trim() || !newPaymentAmount || Number(newPaymentAmount) <= 0}
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="text-sm text-blue-700">Total</div>
              <div className="text-2xl font-bold text-blue-700">${calculatePaymentTotals().Total.toLocaleString()}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentSummaryOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
