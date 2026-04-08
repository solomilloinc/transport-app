'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Bus, Clock, Edit, Plus, Search, Trash, Trash2, TruckIcon, UserPlusIcon, Wrench, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteLogic, get, post, put } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteDialog } from '@/components/dashboard/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormReducer } from '@/hooks/use-form-reducer';
import { toast } from '@/hooks/use-toast';
import { PagedResponse, PaginationParams } from '@/services/types';
import { emptyService, Service } from '@/interfaces/service';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Vehicle } from '@/interfaces/vehicle';
import { useFormValidation } from '@/hooks/use-form-validation';
import { getOptionIdByValue } from '@/utils/form-options';
import { emptyServiceSchedule, ServiceSchedule } from '@/interfaces/serviceSchedule';
import { Label } from '@/components/ui/label';
import { getServiceReport } from '@/services/service';
import { useReportFilters } from '@/hooks/use-report-filters';
import {
  ServiceReportFilters,
  emptyServiceReportFilters,
} from '@/interfaces/filters/service-filters';
import {
  ENTITY_STATUS_OPTIONS,
  EntityStatus,
} from '@/interfaces/filters/common';
import { StatusFilter } from '@/components/dashboard/status-filter';
import { enumParser, stringParser } from '@/hooks/url-parsers';

const serviceFilterParsers = {
  name: stringParser,
  status: enumParser<EntityStatus>([
    EntityStatus.Active,
    EntityStatus.Inactive,
    EntityStatus.Deleted,
    EntityStatus.Suspended,
  ]),
};
import { getTripsForSelect, getTripById } from '@/services/trip';
import { Trip } from '@/interfaces/trip';
import { Checkbox } from '@/components/ui/checkbox';

const initialService = {
  name: '',
  tripId: 0,
  startDay: '',
  endDay: '',
  estimatedDuration: '',
  departureHour: '',
  isHoliday: false,
  vehicleId: 0,
  Schedules: [] as ServiceSchedule[], // Keep as Schedules for form consistency
};

const initialSchedule = {
  ServiceScheduleId: 0,
  ServiceId: 0,
  StartDate: '',
  EndDate: '',
  IsHoliday: false,
  DepartureHour: '10:30:00',
};

const validationSchema = {
  Name: { required: true, message: 'El nombre es requerido' },
  TripId: { required: true, message: 'La ruta comercial es requerida' },
  StartDay: { required: true, message: 'El día de inicio es requerido' },
  EndDay: { required: true, message: 'El día de fin es requerido' },
  EstimatedDuration: { required: true, message: 'La duración estimada es requerida' },
  VehicleId: { required: true, message: 'El vehículo es requerido' },
};

const editValidationSchema = {
  name: { required: true, message: 'El nombre es requerido' },
  tripId: { required: true, message: 'La ruta comercial es requerida' },
  startDay: { required: true, message: 'El día de inicio es requerido' },
  endDay: { required: true, message: 'El día de fin es requerido' },
  estimatedDuration: { required: true, message: 'La duración estimada es requerida' },
  vehicleId: { required: true, message: 'El vehículo es requerido' },
};

const tripValidationSchema = {
  tripId: { required: true, message: 'La ruta comercial es requerida' },
  departureHour: { required: true, message: 'La hora de partida es requerida' },
  vehicleId: { required: true, message: 'El vehículo es requerido' },
  estimatedDuration: { required: true, message: 'La duración estimada es requerida' },
  reserveDate: { required: true, message: 'La fecha es requerida' },
};

const initialTripForm = {
  tripId: 0,
  departureHour: '10:00',
  vehicleId: 0,
  estimatedDuration: '01:00',
  reserveDate: format(new Date(), 'yyyy-MM-dd'),
};

type ServiceFilterDraft = Pick<ServiceReportFilters, 'name' | 'status'>;

export default function ServiceManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);
  const addForm = useFormValidation(emptyService, validationSchema);
  const editForm = useFormValidation(initialService, editValidationSchema);
  const tripForm = useFormValidation(initialTripForm, tripValidationSchema);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [trips, setTrips] = useState<SelectOption[]>([]);
  const [tripsData, setTripsData] = useState<Trip[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [editSchedules, setEditSchedules] = useState<ServiceSchedule[]>([]);

  // Directions whitelist state
  interface DirectionOption {
    id: number;
    name: string;
    type: 'pickup' | 'dropoff';
  }
  const [availableDirections, setAvailableDirections] = useState<DirectionOption[]>([]);
  const [selectedDirectionIds, setSelectedDirectionIds] = useState<number[]>([]);
  const [editSelectedDirectionIds, setEditSelectedDirectionIds] = useState<number[]>([]);
  const [tripFormDirectionIds, setTripFormDirectionIds] = useState<number[]>([]);
  const [tripFormAvailableDirections, setTripFormAvailableDirections] = useState<DirectionOption[]>([]);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [isLoadingTripFormDirections, setIsLoadingTripFormDirections] = useState(false);

  const {
    draft,
    setDraftField,
    apply,
    reset,
    refetch,
    pageNumber,
    setPageNumber,
    data,
    loading,
  } = useReportFilters<ServiceFilterDraft, Service>({
    defaults: { name: '', status: undefined },
    parsers: serviceFilterParsers,
    apiCall: getServiceReport,
  });

  const loadAllOptions = async () => {
    try {
      setIsOptionsLoading(true);
      setOptionsError(null);

      // Llamadas API (pueden ir en paralelo)
      const [vehicleResponse, tripResponse] = await Promise.all([
        get<any, PagedResponse<Vehicle>>('/vehicle-report', {
          pageNumber: 1,
          pageSize: 100,
          sortBy: 'fecha',
          sortDescending: true,
        }),
        get<any, PagedResponse<Trip>>('/trip-report', {
          pageNumber: 1,
          pageSize: 100,
          sortBy: 'description',
          sortDescending: false,
          filters: { status: 1 },
        }),
      ]);

      // Cargar vehículos
      if (vehicleResponse) {
        const formattedVehicles = vehicleResponse.Items.map((vehicle: Vehicle) => ({
          id: vehicle.VehicleTypeId.toString(),
          value: vehicle.VehicleTypeId.toString(),
          label: vehicle.VehicleTypeName + vehicle.InternalNumber,
        }));
        setVehicles(formattedVehicles);
      }

      // Cargar trips
      if (tripResponse) {
        setTripsData(tripResponse.Items);
        const formattedTrips = tripResponse.Items.map((trip: Trip) => ({
          id: trip.TripId.toString(),
          value: trip.TripId.toString(),
          label: trip.Description,
        }));
        setTrips(formattedTrips);
      }
    } catch (error) {
      setOptionsError('Error al cargar las opciones');
    } finally {
      setIsOptionsLoading(false);
    }
  };

  // Load directions for a specific trip
  const loadTripDirections = async (tripId: number) => {
    if (!tripId) {
      setAvailableDirections([]);
      return;
    }

    setIsLoadingDirections(true);
    try {
      const tripData = await getTripById(tripId);
      const directions: DirectionOption[] = [];

      // Extract pickup directions
      const pickupOptions = tripData?.PickupOptions || (tripData as any)?.pickupOptions || [];
      pickupOptions.forEach((opt: any) => {
        const id = opt.directionId || opt.DirectionId;
        const name = opt.displayName || opt.DisplayName;
        if (id != null) {
          directions.push({ id, name: `[Subida] ${name}`, type: 'pickup' });
        }
      });

      // Extract dropoff directions from all cities
      const dropoffOptionsIda = tripData?.DropoffOptionsIda || (tripData as any)?.dropoffOptionsIda || [];
      dropoffOptionsIda.forEach((cityOpt: any) => {
        const cityDirections = cityOpt.directions || cityOpt.Directions || [];
        cityDirections.forEach((dir: any) => {
          const id = dir.directionId || dir.DirectionId;
          const name = dir.displayName || dir.DisplayName;
          if (id != null) {
            directions.push({ id, name: `[Bajada] ${name}`, type: 'dropoff' });
          }
        });
      });

      setAvailableDirections(directions);
    } catch (error) {
      console.error('Error loading trip directions:', error);
      setAvailableDirections([]);
    } finally {
      setIsLoadingDirections(false);
    }
  };

  // Load directions for the trip form (reserve creation)
  const loadTripFormDirections = async (tripId: number) => {
    if (!tripId) {
      setTripFormAvailableDirections([]);
      return;
    }

    setIsLoadingTripFormDirections(true);
    try {
      const tripData = await getTripById(tripId);
      const directions: DirectionOption[] = [];

      // Extract pickup directions
      const pickupOptions = tripData?.PickupOptions || (tripData as any)?.pickupOptions || [];
      pickupOptions.forEach((opt: any) => {
        const id = opt.directionId || opt.DirectionId;
        const name = opt.displayName || opt.DisplayName;
        if (id != null) {
          directions.push({ id, name: `[Subida] ${name}`, type: 'pickup' });
        }
      });

      // Extract dropoff directions from all cities
      const dropoffOptionsIda = tripData?.DropoffOptionsIda || (tripData as any)?.dropoffOptionsIda || [];
      dropoffOptionsIda.forEach((cityOpt: any) => {
        const cityDirections = cityOpt.directions || cityOpt.Directions || [];
        cityDirections.forEach((dir: any) => {
          const id = dir.directionId || dir.DirectionId;
          const name = dir.displayName || dir.DisplayName;
          if (id != null) {
            directions.push({ id, name: `[Bajada] ${name}`, type: 'dropoff' });
          }
        });
      });

      setTripFormAvailableDirections(directions);
    } catch (error) {
      console.error('Error loading trip form directions:', error);
      setTripFormAvailableDirections([]);
    } finally {
      setIsLoadingTripFormDirections(false);
    }
  };

  const addSchedule = () => {
    const newSchedule = emptyServiceSchedule;
    addForm.setField('Schedules', [...addForm.data.Schedules, newSchedule]);
  };

  const removeSchedule = (index: number) => {
    const updatedSchedules = [...addForm.data.Schedules];
    updatedSchedules.splice(index, 1);
    addForm.setField('Schedules', updatedSchedules);
  };

  const submitAddService = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        // Transform the data to match the API expectations
        const transformedData = {
          ...data,
          EstimatedDuration: data.EstimatedDuration + ':00', // Convert HH:MM to HH:MM:SS format
          StartDay: data.StartDay, // Keep in main service
          EndDay: data.EndDay,     // Keep in main service
          Schedules: data.Schedules.map(schedule => ({
            ...schedule,
            DepartureHour: schedule.DepartureHour + ':00' // Convert HH:MM to HH:MM:SS format
          })),
          AllowedDirectionIds: selectedDirectionIds.length > 0 ? selectedDirectionIds : null,
        };
        const response = await post('/service-create', transformedData);
        if (response) {
          toast({
            title: 'Servicio creado',
            description: 'El servicio ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          refetch(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el servicio',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el servicio',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditService = async () => {
    console.log('submitEditService called');
    console.log('editForm.data:', editForm.data);
    console.log('editForm.errors:', editForm.errors);
    console.log('currentServiceId:', currentServiceId);

    editForm.handleSubmit(async (data) => {
      console.log('handleSubmit callback called with data:', data);
      try {
        // Transform the data to match the API expectations
        const transformedData = {
          Name: data.name,
          TripId: data.tripId,
          EstimatedDuration: data.estimatedDuration + ':00', // Convert HH:MM to HH:MM:SS format
          StartDay: data.startDay,
          EndDay: data.endDay,
          VehicleId: data.vehicleId,
          Schedules: editSchedules.map(schedule => ({
            ...schedule,
            DepartureHour: schedule.DepartureHour.includes(':')
              ? schedule.DepartureHour + ':00'
              : schedule.DepartureHour // Convert HH:MM to HH:MM:SS format
          })),
          AllowedDirectionIds: editSelectedDirectionIds.length > 0 ? editSelectedDirectionIds : null,
        };
        console.log('Transformed data for update:', transformedData);
        const response = await put(`/service-update/${currentServiceId}`, transformedData);
        if (response) {
          toast({
            title: 'Servicio actualizado',
            description: 'El servicio ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          refetch(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el servicio',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar el servicio',
          variant: 'destructive',
        });
      }
    });
  };

  const submitAddTrip = async () => {
    tripForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          TripId: data.tripId,
          ReserveDate: data.reserveDate,
          VehicleId: data.vehicleId,
          DepartureHour: data.departureHour + ':00', // Convert HH:MM to HH:MM:SS
          EstimatedDuration: data.estimatedDuration + ':00', // Convert HH:MM to HH:MM:SS
          IsHoliday: false,
          AllowedDirectionIds: tripFormDirectionIds.length > 0 ? tripFormDirectionIds : null,
        };
        const response = await post('/reserve-create', transformedData);
        if (response) {
          toast({
            title: 'Viaje creado',
            description: 'El viaje ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddTripModalOpen(false);
          // Opcionalmente refrescar si hay algo que refrescar
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el viaje',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el viaje',
          variant: 'destructive',
        });
      }
    });
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const updatedSchedules = [...addForm.data.Schedules];
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value,
    };
    addForm.setField('Schedules', updatedSchedules);
  };

  // Edit schedule functions
  const addEditSchedule = () => {
    const newSchedule = { ...emptyServiceSchedule };
    setEditSchedules([...editSchedules, newSchedule]);
  };

  const removeEditSchedule = (index: number) => {
    const updatedSchedules = [...editSchedules];
    updatedSchedules.splice(index, 1);
    setEditSchedules(updatedSchedules);
  };

  const handleEditScheduleChange = (index: number, field: string, value: any) => {
    const updatedSchedules = [...editSchedules];
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value,
    };
    setEditSchedules(updatedSchedules);
  };

  const handleAddService = () => {
    setCurrentServiceId(null);
    addForm.resetForm();
    setSelectedDirectionIds([]);
    setAvailableDirections([]);
    setIsAddModalOpen(true);
    loadAllOptions();
  };

  const handleEditService = (service: Service) => {
    setCurrentServiceId(service.ServiceId);
    // Convert TimeSpan format (HH:MM:SS) back to HH:MM for the time input
    const durationParts = service.EstimatedDuration.split(':');
    const formattedDuration = `${durationParts[0]}:${durationParts[1]}`;

    console.log('Service for editing:', service);
    console.log('Service.Schedulers:', service.Schedulers);

    editForm.setField('name', service.Name);
    editForm.setField('tripId', service.TripId);
    editForm.setField('estimatedDuration', formattedDuration);
    editForm.setField('startDay', service.StartDay || 1); // Default to Monday if not provided
    editForm.setField('endDay', service.EndDay || 5);   // Default to Friday if not provided
    editForm.setField('vehicleId', service.Vehicle.VehicleId);

    console.log('Setting StartDay:', service.StartDay);
    console.log('Setting EndDay:', service.EndDay);
    console.log('EditForm data after setting:', editForm.data);

    // Convert schedules DepartureHour from TimeSpan (HH:MM:SS) to HH:MM for time inputs
    const schedulers = service.Schedulers || [];
    console.log('Original schedulers:', schedulers);

    const formattedSchedulers = schedulers.length > 0
      ? schedulers.map(scheduler => ({
        ...scheduler,
        DepartureHour: scheduler.DepartureHour.includes(':')
          ? scheduler.DepartureHour.split(':').slice(0, 2).join(':')
          : scheduler.DepartureHour
      }))
      : [{ ...emptyServiceSchedule }]; // Si no hay schedulers, crear uno por defecto

    console.log('Formatted schedulers:', formattedSchedulers);
    setEditSchedules(formattedSchedulers);

    // Load directions for editing - extract IDs from AllowedDirections
    const existingDirectionIds = (service.AllowedDirections || []).map(d => d.DirectionId);
    setEditSelectedDirectionIds(existingDirectionIds);
    loadTripDirections(service.TripId);

    setIsEditModalOpen(true);
    loadAllOptions();
  };

  const handleDeleteService = (id: number) => {
    setCurrentServiceId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/service-delete/${currentServiceId}`);
    setIsDeleteModalOpen(false);
    setCurrentServiceId(null);
    refetch();
  };


  const columns = [
    { header: 'Nombre', accessor: 'Name', width: '25%' },
    {
      header: 'Ruta Comercial',
      accessor: 'TripName',
      width: '25%',
      cell: (service: Service) => service.TripName || '-',
    },
    { header: 'Duración Estimada', accessor: 'EstimatedDuration', width: '20%' },
    {
      header: 'Hora de partida',
      accessor: 'DepartureHour',
      width: '20%',
      cell: (service: Service) => {
        const firstSchedule = service.Schedulers?.[0];
        if (firstSchedule?.DepartureHour) {
          // Format HH:MM:SS to HH:MM
          const parts = firstSchedule.DepartureHour.split(':');
          return `${parts[0]}:${parts[1]}`;
        }
        return '-';
      },
    },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '20%',
      cell: (service: Service) => <StatusBadge status={service.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '25%',
      cell: (service: Service) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditService(service)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeleteService(service.ServiceId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicios"
        description="Gestiona y visualiza toda la información de los servicios."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              tripForm.resetForm();
              setTripFormDirectionIds([]);
              setTripFormAvailableDirections([]);
              setIsAddTripModalOpen(true);
              loadAllOptions();
            }}>
              <TruckIcon className="mr-2 h-4 w-4" />
              Agregar viaje
            </Button>
            <Button onClick={() => handleAddService()}>
              <Wrench className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
        }
      />


      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <FilterBar onReset={reset} onApply={apply}>
              <Input
                className="w-full sm:w-[180px]"
                placeholder="Nombre"
                value={draft.name ?? ''}
                onChange={(e) => setDraftField('name', e.target.value)}
              />
              <StatusFilter
                value={draft.status != null ? String(draft.status) : ''}
                onChange={(v) =>
                  setDraftField('status', v ? (Number(v) as EntityStatus) : undefined)
                }
                options={ENTITY_STATUS_OPTIONS}
              />
            </FilterBar>

            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={data?.Items ?? []}
                emptyMessage="No se encontraron servicios."
                isLoading={loading}
                skeletonRows={data?.PageSize}
              />
            </div>

            {data?.Items?.length > 0 && (
              <TablePagination
                currentPage={pageNumber}
                totalPages={data?.TotalPages}
                totalItems={data?.TotalRecords}
                itemsPerPage={data?.PageSize}
                onPageChange={setPageNumber}
                itemName="servicios"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile view - Card layout */}
      <div className="md:hidden space-y-4 mt-4">
        {loading ? (
          // Mobile skeleton loading state
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-card-${index}`} className="w-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, fieldIndex) => (
                    <div key={`skeleton-field-${fieldIndex}`}>
                      <Skeleton className="h-4 w-[80px] mb-1" />
                      <Skeleton className="h-5 w-[120px]" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.Items?.length > 0 ? (
          data?.Items?.map((service) => (
            <MobileCard
              key={service.ServiceId}
              title={service.Name}
              subtitle={service.ServiceId.toString()}
              badge={<StatusBadge status={service.Status ? 'Activo' : 'Inactivo'} />}
              fields={[
                { label: 'Ruta Comercial', value: service.TripName || '-' },
                { label: 'Duración Estimada', value: service.EstimatedDuration },
                { label: 'Hora de partida', value: service.Schedulers?.[0]?.DepartureHour?.split(':').slice(0, 2).join(':') || '-' },
              ]}
              onEdit={() => handleEditService(service)}
              onDelete={() => handleDeleteService(service.ServiceId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron servicios.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Agregar nuevo servicio"
        description="Crea un nuevo servicio completando el formulario a continuación."
        onSubmit={() => submitAddService()}
        submitText="Crear Servicio"
      >
        <div className="w-full">
          <div className="grid grid-cols-1 gap-4">
            {/* Información Personal */}
            <div className="w-full">
              <FormField label="Nombre" required error={addForm.errors.Name}>
                <Input id="name" placeholder="Nombre" value={addForm.data.Name} onChange={(e) => addForm.setField('Name', e.target.value)} />
              </FormField>
            </div>
            <div className="w-full">
              <FormField label="Ruta Comercial" required error={addForm.errors.TripId}>
                <ApiSelect
                  value={String(addForm.data.TripId)}
                  onValueChange={(value) => {
                    const tripId = Number(value);
                    addForm.setField('TripId', tripId);
                    // Load available directions for this trip
                    setSelectedDirectionIds([]);
                    loadTripDirections(tripId);
                  }}
                  placeholder="Seleccionar ruta comercial"
                  options={trips}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando rutas..."
                  errorMessage="Error al cargar las rutas"
                  emptyMessage="No hay rutas disponibles"
                />
              </FormField>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Dia Inicio" required error={addForm.errors.StartDay}>
                <Select onValueChange={(value) => addForm.setField('StartDay', Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar Día" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miercoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                    <SelectItem value="0">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Dia Fin" required error={addForm.errors.EndDay}>
                <Select onValueChange={(value) => addForm.setField('EndDay', Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar Día" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miercoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                    <SelectItem value="0">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Duración Estimada (HH:MM)" required error={addForm.errors.EstimatedDuration}>
                <Input
                  id="estimatedDuration"
                  type="time"
                  placeholder="HH:MM"
                  value={addForm.data.EstimatedDuration}
                  onChange={(e) => addForm.setField('EstimatedDuration', e.target.value)}
                />
              </FormField>
              <FormField label="Vehículo" required error={addForm.errors.VehicleId}>
                <ApiSelect
                  value={String(addForm.data.VehicleId)}
                  onValueChange={(value) => addForm.setField('VehicleId', Number(value))}
                  placeholder="Seleccionar vehículo"
                  options={vehicles}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando vehiculos..."
                  errorMessage="Error al cargar los vehículos"
                  emptyMessage="No hay vehículos disponibles"
                />
              </FormField>
            </div>
            <div className="space-y-4">
              <Label className="text-base font-medium">Horarios de Salida</Label>

              {/* Schedule List */}
              <div className="space-y-3">
                {(addForm.data.Schedules || []).map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">Hora de Salida</Label>
                        <Input
                          type="time"
                          value={schedule.DepartureHour}
                          onChange={(e) => handleScheduleChange(index, 'DepartureHour', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Es Feriado</Label>
                        <Select
                          value={schedule.IsHoliday.toString()}
                          onValueChange={(value) => handleScheduleChange(index, 'IsHoliday', value === 'true')}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="true">Sí</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {(addForm.data.Schedules || []).length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Schedule Button */}
              <Button
                type="button"
                variant="outline"
                onClick={addSchedule}
                className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-solid bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Horario
              </Button>
            </div>

            {/* Directions Whitelist */}
            {addForm.data.TripId > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Direcciones Permitidas</Label>
                <p className="text-sm text-muted-foreground">
                  Selecciona las direcciones habilitadas para este servicio. Si no seleccionas ninguna, todas estarán disponibles.
                </p>
                {isLoadingDirections ? (
                  <div className="text-sm text-muted-foreground">Cargando direcciones...</div>
                ) : availableDirections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {availableDirections.map((dir) => (
                      <div key={dir.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dir-add-${dir.id}`}
                          checked={selectedDirectionIds.includes(dir.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDirectionIds([...selectedDirectionIds, dir.id]);
                            } else {
                              setSelectedDirectionIds(selectedDirectionIds.filter(id => id !== dir.id));
                            }
                          }}
                        />
                        <Label htmlFor={`dir-add-${dir.id}`} className="text-sm font-normal cursor-pointer">
                          {dir.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground border rounded-lg p-3">
                    No hay direcciones disponibles para esta ruta.
                  </div>
                )}
                {selectedDirectionIds.length > 0 && (
                  <div className="text-sm text-blue-600">
                    {selectedDirectionIds.length} dirección(es) seleccionada(s)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FormDialog>

      {/* Add Customer Modal */}

      {/* Edit Customer Modal */}

      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar servicio"
        description="Realiza cambios en los detalles del servicio a continuación."
        onSubmit={() => submitEditService()}
        submitText="Guardar Cambios"
      >
        <div className="w-full">
          <div className="grid grid-cols-1 gap-4">
            <div className="w-full">
              <FormField label="Nombre" required error={editForm.errors.name}>
                <Input id="edit-name" placeholder="Nombre" value={editForm.data.name} onChange={(e) => editForm.setField('name', e.target.value)} />
              </FormField>
            </div>
            <div className="w-full">
              <FormField label="Ruta Comercial" required error={editForm.errors.tripId}>
                <ApiSelect
                  value={String(editForm.data.tripId)}
                  onValueChange={(value) => {
                    const tripId = Number(value);
                    editForm.setField('tripId', tripId);
                    // Load available directions for this trip
                    setEditSelectedDirectionIds([]);
                    loadTripDirections(tripId);
                  }}
                  placeholder="Seleccionar ruta comercial"
                  options={trips}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando rutas..."
                  errorMessage="Error al cargar las rutas"
                  emptyMessage="No hay rutas disponibles"
                />
              </FormField>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Dia Inicio" required error={editForm.errors.startDay}>
                <Select value={String(editForm.data.startDay)} onValueChange={(value) => editForm.setField('startDay', Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar Día" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miercoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                    <SelectItem value="0">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Dia Fin" required error={editForm.errors.endDay}>
                <Select value={String(editForm.data.endDay)} onValueChange={(value) => editForm.setField('endDay', Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar Día" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miercoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                    <SelectItem value="0">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Duración Estimada (HH:MM)" required error={editForm.errors.estimatedDuration}>
                <Input
                  id="edit-estimatedDuration"
                  type="time"
                  placeholder="HH:MM"
                  value={editForm.data.estimatedDuration}
                  onChange={(e) => editForm.setField('estimatedDuration', e.target.value)}
                />
              </FormField>
              <FormField label="Vehículo" required error={editForm.errors.vehicleId}>
                <ApiSelect
                  value={String(editForm.data.vehicleId)}
                  onValueChange={(value) => editForm.setField('vehicleId', Number(value))}
                  placeholder="Seleccionar vehículo"
                  options={vehicles}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando vehiculos..."
                  errorMessage="Error al cargar los vehículos"
                  emptyMessage="No hay vehículos disponibles"
                />
              </FormField>
            </div>
            <div className="space-y-4">
              <Label className="text-base font-medium">Horarios de Salida</Label>

              {/* Edit Schedule List */}
              <div className="space-y-3">
                {editSchedules.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">Hora de Salida</Label>
                        <Input
                          type="time"
                          value={schedule.DepartureHour}
                          onChange={(e) => handleEditScheduleChange(index, 'DepartureHour', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Es Feriado</Label>
                        <Select
                          value={schedule.IsHoliday.toString()}
                          onValueChange={(value) => handleEditScheduleChange(index, 'IsHoliday', value === 'true')}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="true">Sí</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {editSchedules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEditSchedule(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Edit Schedule Button */}
              <Button
                type="button"
                variant="outline"
                onClick={addEditSchedule}
                className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-solid bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Horario
              </Button>
            </div>

            {/* Directions Whitelist */}
            {editForm.data.tripId > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Direcciones Permitidas</Label>
                <p className="text-sm text-muted-foreground">
                  Selecciona las direcciones habilitadas para este servicio. Si no seleccionas ninguna, todas estarán disponibles.
                </p>
                {isLoadingDirections ? (
                  <div className="text-sm text-muted-foreground">Cargando direcciones...</div>
                ) : availableDirections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {availableDirections.map((dir) => (
                      <div key={dir.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dir-edit-${dir.id}`}
                          checked={editSelectedDirectionIds.includes(dir.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditSelectedDirectionIds([...editSelectedDirectionIds, dir.id]);
                            } else {
                              setEditSelectedDirectionIds(editSelectedDirectionIds.filter(id => id !== dir.id));
                            }
                          }}
                        />
                        <Label htmlFor={`dir-edit-${dir.id}`} className="text-sm font-normal cursor-pointer">
                          {dir.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground border rounded-lg p-3">
                    No hay direcciones disponibles para esta ruta.
                  </div>
                )}
                {editSelectedDirectionIds.length > 0 && (
                  <div className="text-sm text-blue-600">
                    {editSelectedDirectionIds.length} dirección(es) seleccionada(s)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <FormDialog
        open={isAddTripModalOpen}
        onOpenChange={setIsAddTripModalOpen}
        title="Crear Nuevo Viaje"
        description="Crea una instancia de viaje específica completando el formulario."
        onSubmit={() => submitAddTrip()}
        submitText="Crear Viaje"
      >
        <div className="w-full grid grid-cols-1 gap-4">
          <div className="w-full">
            <FormField label="Ruta Comercial" required error={tripForm.errors.tripId}>
              <ApiSelect
                value={String(tripForm.data.tripId)}
                onValueChange={(value) => {
                  const tripId = Number(value);
                  tripForm.setField('tripId', tripId);
                  // Load available directions for this trip
                  setTripFormDirectionIds([]);
                  loadTripFormDirections(tripId);
                }}
                placeholder="Seleccionar ruta comercial"
                options={trips}
                loading={isOptionsLoading}
                error={optionsError}
                loadingMessage="Cargando rutas..."
                errorMessage="Error al cargar las rutas"
                emptyMessage="No hay rutas disponibles"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Vehículo" required error={tripForm.errors.vehicleId}>
              <ApiSelect
                value={String(tripForm.data.vehicleId)}
                onValueChange={(value) => tripForm.setField('vehicleId', Number(value))}
                placeholder="Seleccionar vehículo"
                options={vehicles}
                loading={isOptionsLoading}
                error={optionsError}
                loadingMessage="Cargando vehiculos..."
                errorMessage="Error al cargar los vehículos"
                emptyMessage="No hay vehículos disponibles"
              />
            </FormField>
            <FormField label="Fecha de Viaje" required error={tripForm.errors.reserveDate}>
              <Input
                type="date"
                value={tripForm.data.reserveDate}
                onChange={(e) => tripForm.setField('reserveDate', e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Hora de Partida" required error={tripForm.errors.departureHour}>
              <Input
                type="time"
                value={tripForm.data.departureHour}
                onChange={(e) => tripForm.setField('departureHour', e.target.value)}
              />
            </FormField>
            <FormField label="Duración Estimada (HH:MM)" required error={tripForm.errors.estimatedDuration}>
              <Input
                type="time"
                value={tripForm.data.estimatedDuration}
                onChange={(e) => tripForm.setField('estimatedDuration', e.target.value)}
              />
            </FormField>
          </div>

          {/* Directions Whitelist */}
          {tripForm.data.tripId > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Direcciones Permitidas</Label>
              <p className="text-sm text-muted-foreground">
                Selecciona las direcciones habilitadas para este viaje. Si no seleccionas ninguna, todas estarán disponibles.
              </p>
              {isLoadingTripFormDirections ? (
                <div className="text-sm text-muted-foreground">Cargando direcciones...</div>
              ) : tripFormAvailableDirections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {tripFormAvailableDirections.map((dir) => (
                    <div key={dir.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dir-trip-${dir.id}`}
                        checked={tripFormDirectionIds.includes(dir.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTripFormDirectionIds([...tripFormDirectionIds, dir.id]);
                          } else {
                            setTripFormDirectionIds(tripFormDirectionIds.filter(id => id !== dir.id));
                          }
                        }}
                      />
                      <Label htmlFor={`dir-trip-${dir.id}`} className="text-sm font-normal cursor-pointer">
                        {dir.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground border rounded-lg p-3">
                  No hay direcciones disponibles para esta ruta.
                </div>
              )}
              {tripFormDirectionIds.length > 0 && (
                <div className="text-sm text-blue-600">
                  {tripFormDirectionIds.length} dirección(es) seleccionada(s)
                </div>
              )}
            </div>
          )}
        </div>
      </FormDialog>

      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y todos los datos asociados de nuestros servidores."
      />
    </div>
  );
}
