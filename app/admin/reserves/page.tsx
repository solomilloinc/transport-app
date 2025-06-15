'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, set } from 'date-fns';
import { es, is, se } from 'date-fns/locale';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PrinterIcon,
  UserPlusIcon,
  TrashIcon,
  DollarSignIcon,
  PlusCircleIcon,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FilterIcon,
  BusIcon,
  TicketPlus,
  TicketPlusIcon,
  Edit2Icon,
  Edit2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { get, post } from '@/services/api';
import { Reserve, ReserveReport } from '@/interfaces/reserve';
import { PagedResponse } from '@/services/types';
import { City } from '@/interfaces/city';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Passenger } from '@/interfaces/passengers';
import { PassengerReserve, PassengerReserveCreate, PassengerReserveReport } from '@/interfaces/passengerReserve';
import { Vehicle } from '@/interfaces/vehicle';
import { toast } from '@/hooks/use-toast';
import { Direction } from '@/interfaces/direction';
import { useFormValidation } from '@/hooks/use-form-validation';
import { Calendar } from '@/components/ui/calendar';

// Add a helper function to get client balance before the ReservationsPage function
const getClientBalance = (dni: string) => {
  // const client = passe.find((c) => c.dni === dni);
  // if (!client) return null;
  // const balanceRecord = mockClientBalances.find((b) => b.clientId === client.id);
  // return balanceRecord ? balanceRecord.balance : null;
  return 1;
};

// Generate calendar days
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();

  // Get days from previous month to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: startDay }, (_, i) => ({
    day: prevMonthLastDay - startDay + i + 1,
    month: month - 1,
    year,
    isCurrentMonth: false,
  }));

  // Current month days
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    month,
    year,
    isCurrentMonth: true,
  }));

  // Calculate how many days we need from next month
  const totalDaysShown = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const nextMonthDays = Array.from(
    {
      length: totalDaysShown - (prevMonthDays.length + currentMonthDays.length),
    },
    (_, i) => ({
      day: i + 1,
      month: month + 1,
      year,
      isCurrentMonth: false,
    })
  );

  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
};

const initialPassengerReserve: PassengerReserveCreate = {
  ReserveId: 0,
  CustomerId: 0,
  PickupLocationId: 0,
  DropoffLocationId: 0,
  IsPayment: true,
  StatusPaymentId: 1, // Assuming 1 means paid
  PaymentMethod: 1, // Assuming 1 is cash
  Price: 650,
  ReserveTypeId: 1,
  HasTraveled: true,
};

const initialReserve = {
  VehicleId: 0,
  DepartureHour: '',
};

const initialPassengers = {
  FirstName: '',
  LastName: '',
  Email: '',
  DocumentNumber: '',
  Phone1: '',
  Phone2: '',
};

const validationConfigPassenger = {
  FirstName: {
    required: { message: 'El nombre es requerido' },
  },
  LastName: {
    required: { message: 'El apellido es requerido' },
  },
  Email: {
    required: { message: 'El email es requerido' },
  },
  DocumentNumber: {
    required: { message: 'El número de documento es requerido' },
  },
  Phone1: {
    required: { message: 'El teléfono 1 es requerido' },
  },
};

const validationConfigReserve = {
  VehicleId: {
    required: { message: 'El vehículo es requerido' },
  },
  DepartureHour: {
    required: { message: 'La hora de salida es requerida' },
  },
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
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [passengersReserves, setPassengersReserves] = useState<PagedResponse<PassengerReserveReport>>({
    Items: [],
    PageNumber: 1,
    PageSize: 8,
    TotalRecords: 0,
    TotalPages: 0,
  });
  const [selectedPassengerReserve, setSelectedPassengerReserve] = useState<PassengerReserveReport | null>(null);
  const [originFilter, setOriginFilter] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(true);

  const [reserves, setReserves] = useState<PagedResponse<ReserveReport>>({
    Items: [],
    PageNumber: 1,
    PageSize: 8,
    TotalRecords: 0,
    TotalPages: 0,
  });

  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Add state for sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [passengerToDelete, setPassengerToDelete] = useState<number | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction>('delete');
  const [isPaymentSummaryOpen, setIsPaymentSummaryOpen] = useState(false);
  const [isPassengerSelectorOpen, setIsPassengerSelectorOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  // Round-trip states
  const [isReturnTripModalOpen, setIsReturnTripModalOpen] = useState(false);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTrip, setReturnTrip] = useState<ReserveReport | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const reserveForm = useFormValidation(initialPassengerReserve, {});

  const [passengerReserve, setPassengerReserve] = useState<PassengerReserveCreate[]>([]);

  const [directions, setDirections] = useState<SelectOption[]>([]);

  const addForm = useFormValidation(initialPassengers, validationConfigPassenger);
  const editFormReserve = useFormValidation(initialReserve, validationConfigReserve);
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

  // Add a new state for the selected payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Efectivo');

  const fetchReserves = async (pageToFetch = currentPage, pageSizeToFetch = pageSize) => {
    setIsLoading(true);
    try {
      const response = await get<any, ReserveReport>(
        `/reserve-report/${format(isRoundTrip ? (returnDate as Date) : (selectedDate as Date), 'yyyyMMdd')}`,
        {
          pageNumber: pageToFetch,
          pageSize: pageSizeToFetch,
          sortBy: 'fecha',
          sortDescending: true,
          filters: {},
        }
      );
      setReserves(response);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const fetchPassengersReserves = async (pageToFetch = currentPage, pageSizeToFetch = pageSize) => {
    setIsLoading(true);
    try {
      const response = await get<any, PassengerReserveReport>(`/customer-reserve-report/${selectedTrip?.ReserveId}`, {
        pageNumber: pageToFetch,
        pageSize: pageSizeToFetch,
        sortBy: 'fecha',
        sortDescending: true,
        filters: {},
      });
      setPassengersReserves(response);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    fetchReserves(1, 10);
    setSelectedTrip(null);
  }, [selectedDate, returnDate]);

  useEffect(() => {
    if (!selectedTrip) return;
    fetchPassengersReserves(1, 20);
    loadAllOptions();
  }, [selectedTrip]);

  // Then add this filtered clients logic after the other useMemo hooks
  // Add this after the filteredTrips useMemo
  const fetchPassenger = async (dni: string) => {
    if (!dni) return;
    try {
      const response = await get<any, Passenger>('/customer-report', {
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'name',
        sortDescending: false,
        filters: { documentNumber: dni },
      });
      setPassengers(response.Items);
    } catch (error) {
      setPassengers([]);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (passengerSearchQuery.length >= 3) {
        fetchPassenger(passengerSearchQuery);
      } else {
        setPassengers([]);
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
      setPassengers([]);
    }
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

  // Handle passenger payment status change
  const handlePassengerReservePaidChange = async (passenger: PassengerReserveReport, checked: boolean) => {
    const updatedPassenger = { ...passenger, IsPayment: checked };
    //aca hacer la llamada pra editar
  };

  // Handle delete passenger
  const handleDeletePassengerReserveClick = (passenger: PassengerReserveReport) => {
    if (passenger) {
      setSelectedPassengerReserve(passenger);
      // setDeleteAction(passenger.paid ? 'favor' : 'delete');
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeletePassenger = () => {
    if (passengerToDelete) {
      // const passenger = passengers.find((p) => p.id === passengerToDelete);
      // if (passenger) {
      //   // Handle different delete actions
      //   if (deleteAction === 'delete') {
      //     // Just delete the passenger
      //     setPassengers(passengers.filter((p) => p.id !== passengerToDelete));
      //   } else if (deleteAction === 'favor') {
      //     // Put money in favor (in a real app, you would update the client's balance)
      //     console.log(`Money in favor for ${passenger.name}: $${passenger.price}`);
      //     setPassengers(passengers.filter((p) => p.id !== passengerToDelete));
      //     // Here you would add the money to the client's account
      //   } else if (deleteAction === 'debt') {
      //     // Add a debt (in a real app, you would create a debt record)
      //     console.log(`Debt added for ${passenger.name}: $${passenger.price}`);
      //     setPassengers(passengers.filter((p) => p.id !== passengerToDelete));
      //     // Here you would create a debt record
      //   }
      // }
      // setIsDeleteModalOpen(false);
      // setPassengerToDelete(null);
      // setDeleteAction('delete');
    }
  };

  // Handle add passenger-reserve
  const handleAddPassenger = () => {
    if (selectedTrip) {
      setSelectedPassenger(null);
      setIsPassengerSelectorOpen(true);
    }
  };

  const submitAddReserve = () => {
    const reserveData: PassengerReserveCreate = {
      ...reserveForm.data,
      ReserveId: selectedTrip?.ReserveId || 0,
      PickupLocationId: Number(reserveForm.data.PickupLocationId) || 0,
      DropoffLocationId: Number(reserveForm.data.DropoffLocationId) || 0,
      Price: selectedTrip?.Prices.find((price) => price.ReserveTypeId === reserveForm.data.ReserveTypeId)?.Price || 0,
    };

    const updatedReserves = [...passengerReserve, reserveData];

    if (reserveData.ReserveTypeId === 2) {
      // Si es ida y vuelta, guardamos solo el viaje de ida y abrimos modal de regreso
      setPassengerReserve([reserveData]);
      setReturnDate(today);
      setIsAddModalOpen(false);
      setIsReturnTripModalOpen(true);
      return;
    }

    finalizeAddPassenger(updatedReserves);
  };

  const finalizeAddPassenger = async (reserves?: PassengerReserveCreate[]) => {
    let payload: PassengerReserveCreate[];

    if (returnTrip && reserveForm.data.ReserveTypeId === 2) {
      // Es un viaje de ida y vuelta, usamos el de ida guardado antes y armamos el de vuelta
      const returnReservation: PassengerReserveCreate = {
        ...reserveForm.data,
        ReserveId: returnTrip.ReserveId,
        PickupLocationId: Number(reserveForm.data.PickupLocationId),
        DropoffLocationId: Number(reserveForm.data.DropoffLocationId),
        Price: returnTrip.Prices.find((price) => price.ReserveTypeId === reserveForm.data.ReserveTypeId)?.Price || 0,
      };
      payload = [...passengerReserve, returnReservation];
    } else if (reserves && reserves.length > 0) {
      payload = reserves;
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la reserva, faltan datos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await post('/passenger-reserves-create', { items: payload });

      if (response) {
        toast({
          title: 'Reserva creada',
          description: 'La reserva ha sido creada exitosamente',
          variant: 'success',
        });
        fetchReserves();
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
      fetchPassengersReserves();
    }
  };

  const resetReservaForm = () => {
    setIsAddModalOpen(false);
    setIsReturnTripModalOpen(false);
    setPassengerReserve([]);
    setPassengerSearchQuery('');
    setSelectedPassenger(null);
    setReturnTrip(null);
    setIsRoundTrip(false);
    reserveForm.resetForm();
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
          fetchReserves();
          setIsAddModalOpen(false);
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
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/customer-create', data);
        if (response) {
          toast({
            title: 'Pasajero creado',
            description: 'El pasajero ha sido creado exitosamente',
            variant: 'success',
          });
          //Aca debe mandar el passenger completo para
          // setSelectedPassenger({
          //   ...data,
          //   CustomerId: 1,
          //   Status: 'Activo',
          // });
          setIsNewClientModalOpen(false);
          setIsAddModalOpen(true);
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

  // Format date for display
  const formatSelectedDate = () => {
    return format(selectedDate as Date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Format return date for display
  const formatReturnDate = () => {
    return format(returnDate as Date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Weekday headers
  const weekdays = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];

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

    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
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
            <Button
              variant="outline"
              size="icon"
              title="Editar reserva"
              onClick={() => handleEditReserve(selectedTrip ?? undefined)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              title="Resumen de pagos"
              onClick={() => setIsPaymentSummaryOpen(true)}
            >
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
                  <div className="text-lg font-medium text-blue-500">
                    Viajes {format(selectedDate as Date, 'd MMM', { locale: es })}
                  </div>
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
                  {reserves.Items.map((trip) => {
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
                              trip.ReservedQuantity >= trip.AvailableQuantity
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
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

                  {reserves.Items.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No hay viajes disponibles con el origen seleccionado.
                    </div>
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
                {formatSelectedDate().charAt(0).toUpperCase() + formatSelectedDate().slice(1)} -{' '}
                {selectedTrip?.OriginName} → {selectedTrip?.DestinationName}, {selectedTrip?.DepartureHour}
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
                        <button
                          className="flex items-center font-medium text-gray-500 hover:text-gray-700"
                          onClick={() => handleSort('name')}
                        >
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
                      <th className="py-3 pr-4 w-[20%]">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('dropoff')}
                        >
                          Bajada {renderSortIndicator('dropoff')}
                        </button>
                      </th>
                      <th className="py-3 pr-4 text-center">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('paid')}
                        >
                          $ {renderSortIndicator('paid')}
                        </button>
                      </th>
                      <th className="py-3 pr-4 w-[15%]">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('paymentMethod')}
                        >
                          Pago {renderSortIndicator('paymentMethod')}
                        </button>
                      </th>
                      <th className="py-3 pr-4 text-center w-[10%]">
                        <button
                          className="flex items-center justify-center font-medium text-gray-500 hover:text-gray-700 mx-auto"
                          onClick={() => handleSort('price')}
                        >
                          Precio {renderSortIndicator('price')}
                        </button>
                      </th>
                      <th className="py-3 pl-4 text-right w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengersReserves.Items.map((passenger) => (
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
                                      getClientBalance(passenger.DocumentNumber)! < 0
                                        ? 'text-red-500 font-medium'
                                        : 'text-green-600 font-medium'
                                    }
                                  >
                                    {getClientBalance(passenger.DocumentNumber)! < 0
                                      ? `Debe $${Math.abs(
                                          getClientBalance(passenger.DocumentNumber)!
                                        ).toLocaleString()}`
                                      : `A favor $${getClientBalance(passenger.DocumentNumber)!.toLocaleString()}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Select defaultValue={passenger.PickupLocationId.toString()}>
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
                        </td>
                        <td className="py-3 pr-4 text-center">
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
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Checkbox
                            id={`paid-${passenger.CustomerReserveId}`}
                            checked={passenger.IsPayment}
                            onCheckedChange={(checked) =>
                              handlePassengerReservePaidChange(passenger, checked as boolean)
                            }
                            className="mx-auto"
                          />
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
                            className={`w-24 text-right font-mono mx-auto ${
                              !passenger.IsPayment ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!passenger.IsPayment}
                          />
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
                {passengers.map((passenger) => (
                  <div
                    key={passenger.CustomerId}
                    className="flex items-center justify-between p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setSelectedPassenger(passenger);
                      setIsPassengerSelectorOpen(false);
                      setIsAddModalOpen(true);
                      reserveForm.data.CustomerId = passenger.CustomerId;
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

      {/* Vehicle Selector Dialog */}
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
        isLoading={addForm.isSubmitting}
      >
        <FormField label="Nombre" required error={addForm.errors.FirstName}>
          <Input
            id="first-name"
            value={addForm.data.FirstName}
            type="text"
            placeholder="Nombre"
            onChange={(e) => addForm.setField('FirstName', e.target.value)}
          />
        </FormField>
        <FormField label="Apellido" required error={addForm.errors.LastName}>
          <Input
            id="last-name"
            value={addForm.data.LastName}
            placeholder="Apellido"
            type="text"
            onChange={(e) => addForm.setField('LastName', e.target.value)}
          />
        </FormField>
        <FormField label="Email" required error={addForm.errors.Email}>
          <Input id="email" value={addForm.data.Email} onChange={(e) => addForm.setField('Email', e.target.value)} />
        </FormField>
        <FormField label="Número de documento" required error={addForm.errors.DocumentNumber}>
          <Input
            id="documentNumber"
            value={addForm.data.DocumentNumber}
            placeholder="Número de documento"
            type="number"
            onChange={(e) => addForm.setField('DocumentNumber', e.target.value)}
          />
        </FormField>
        <FormField label="Teléfono 1" required error={addForm.errors.Phone1}>
          <Input id="phone1" value={addForm.data.Phone1} onChange={(e) => addForm.setField('Phone1', e.target.value)} />
        </FormField>
        <FormField label="Teléfono 2">
          <Input id="phone2" value={addForm.data.Phone2} onChange={(e) => addForm.setField('Phone2', e.target.value)} />
        </FormField>
      </FormDialog>

      {/* Add Reserve Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir Pasajero al Viaje"
        description={
          selectedPassenger
            ? `Añadiendo a ${selectedPassenger.FirstName} ${selectedPassenger.LastName} (DNI: ${selectedPassenger.DocumentNumber})`
            : 'Añade un nuevo pasajero a este viaje'
        }
        onSubmit={submitAddReserve}
        submitText="Añadir Reserva"
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
      <Dialog open={isReturnTripModalOpen} onOpenChange={setIsReturnTripModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Viaje de Vuelta</DialogTitle>
            <DialogDescription>
              Selecciona la fecha y el servicio para el viaje de vuelta de{' '}
              {selectedPassenger ? `${selectedPassenger.FirstName} ${selectedPassenger.LastName}` : 'el pasajero'}.
            </DialogDescription>
          </DialogHeader>
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
                {returnDate && !isLoading && (
                  <>
                    <div className="font-medium mb-2">
                      Viajes disponibles para {format(returnDate, "d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-4">
                      {/* For simplicity, we're using the same trips, but in a real app you'd fetch trips for the return date */}
                      {reserves.Items.map((trip) => (
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
                      {reserves.Items.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No hay viajes disponibles con el origen seleccionado.
                        </div>
                      )}
                    </div>
                  </>
                )}
                {/* Add pickup and dropoff dropdowns */}
                <div className="space-y-3 mt-4">
                  <div>
                    <FormField label="Dirección de subida" required error={reserveForm.errors.PickupLocationId}>
                      <ApiSelect
                        value={String(reserveForm.data.PickupLocationId)}
                        onValueChange={(value) => reserveForm.setField('PickupLocationId', value)}
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
                    <FormField label="Dirección de bajada" required error={reserveForm.errors.DropoffLocationId}>
                      <ApiSelect
                        value={String(reserveForm.data.DropoffLocationId)}
                        onValueChange={(value) => reserveForm.setField('DropoffLocationId', value)}
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
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsReturnTripModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => finalizeAddPassenger()} disabled={!returnTrip}>
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <RadioGroup
              value={deleteAction}
              onValueChange={(value) => setDeleteAction(value as DeleteAction)}
              className="space-y-3"
            >
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
            <Button variant="destructive" onClick={confirmDeletePassenger}>
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
                <div className="text-2xl font-bold text-blue-500">
                  ${calculatePaymentTotals().Efectivo.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-500">Método</div>
                <div className="text-2xl font-bold text-blue-500">
                  ${calculatePaymentTotals().Método.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Custom payments section */}
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-500">Otros Pagos</div>
                <div className="text-lg font-bold text-blue-500">
                  ${calculatePaymentTotals().Custom.toLocaleString()}
                </div>
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
                  <Input
                    placeholder="Nombre"
                    value={newPaymentName}
                    onChange={(e) => setNewPaymentName(e.target.value)}
                    className="w-full"
                  />
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
