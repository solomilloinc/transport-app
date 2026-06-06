'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Edit, Trash, TruckIcon, Wrench } from 'lucide-react';
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
import { Service, formatServiceSlot } from '@/interfaces/service';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Vehicle } from '@/interfaces/vehicle';
import { useFormValidation } from '@/hooks/use-form-validation';
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
import { getApiErrorMessage, bindApiErrorToForm } from '@/lib/apiErrors';

// Modelo actual (ADR 0003): un Service = UN slot único → dayOfWeek + departureHour.
// `dayOfWeek` se guarda como string en el form ('' = sin elegir, '0'..'6' = día);
// así `required` lo bloquea cuando está vacío y acepta el 0 (Domingo) una vez elegido.
const initialAddService = {
  name: '',
  tripId: 0,
  dayOfWeek: '',
  departureHour: '',
  estimatedDuration: '01:00',
  vehicleId: 0,
};

const initialService = {
  name: '',
  tripId: 0,
  dayOfWeek: '',
  departureHour: '',
  estimatedDuration: '',
  vehicleId: 0,
};

// tripId/vehicleId son selects de ID cuyo "sin elegir" es 0, que `required` no
// detecta (sólo cubre undefined/null/""); por eso van con regla > 0.
// dayOfWeek es string ('' = sin elegir): `required` lo cubre y acepta '0' (Domingo).
const validationSchema = {
  name: { required: { message: 'El nombre es requerido' } },
  tripId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'La ruta comercial es requerida' }],
  },
  dayOfWeek: { required: { message: 'El día es requerido' } },
  departureHour: { required: { message: 'La hora de partida es requerida' } },
  estimatedDuration: { required: { message: 'La duración estimada es requerida' } },
  vehicleId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'El vehículo es requerido' }],
  },
};

const editValidationSchema = {
  name: { required: { message: 'El nombre es requerido' } },
  tripId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'La ruta comercial es requerida' }],
  },
  dayOfWeek: { required: { message: 'El día es requerido' } },
  departureHour: { required: { message: 'La hora de partida es requerida' } },
  estimatedDuration: { required: { message: 'La duración estimada es requerida' } },
  vehicleId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'El vehículo es requerido' }],
  },
};

const tripValidationSchema = {
  // tripId/vehicleId son selects cuyo "sin elegir" es 0, que `required` no detecta
  // (sólo cubre undefined/null/""); por eso validamos > 0 con una regla.
  tripId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'La ruta comercial es requerida' }],
  },
  departureHour: { required: { message: 'La hora de partida es requerida' } },
  vehicleId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'El vehículo es requerido' }],
  },
  estimatedDuration: { required: { message: 'La duración estimada es requerida' } },
  reserveDate: { required: { message: 'La fecha es requerida' } },
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
  const addForm = useFormValidation(initialAddService, validationSchema);
  const editForm = useFormValidation(initialService, editValidationSchema);
  const tripForm = useFormValidation(initialTripForm, tripValidationSchema);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [trips, setTrips] = useState<SelectOption[]>([]);
  const [tripsData, setTripsData] = useState<Trip[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

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
          // Combo de alta/edición — sólo Vehículos Active.
          // El filtro de Inactive/Suspended sigue disponible en /admin/vehicles.
          filters: { status: EntityStatus.Active },
        }),
        get<any, PagedResponse<Trip>>('/trip-report', {
          pageNumber: 1,
          pageSize: 100,
          sortBy: 'description',
          sortDescending: false,
          filters: { status: 1 },
        }),
      ]);

      // Cargar vehículos. La opción se identifica por vehicleId (único por coche);
      // antes usaba vehicleTypeId, que se repite entre coches del mismo tipo y hacía
      // que el Select marcara 2 ítems a la vez (y mandaba el id equivocado al backend).
      if (vehicleResponse) {
        const formattedVehicles = vehicleResponse.items.map((vehicle: Vehicle) => ({
          id: vehicle.vehicleId.toString(),
          value: vehicle.vehicleId.toString(),
          label: `${vehicle.vehicleTypeName} (${vehicle.internalNumber})`,
        }));
        setVehicles(formattedVehicles);
      }

      // Cargar trips
      if (tripResponse) {
        setTripsData(tripResponse.items);
        const formattedTrips = tripResponse.items.map((trip: Trip) => ({
          id: trip.tripId.toString(),
          value: trip.tripId.toString(),
          label: trip.description,
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
      const pickupOptions = tripData?.pickupOptions || (tripData as any)?.pickupOptions || [];
      pickupOptions.forEach((opt: any) => {
        const id = opt.directionId || opt.directionId;
        const name = opt.displayName || opt.displayName;
        if (id != null) {
          directions.push({ id, name: `[Subida] ${name}`, type: 'pickup' });
        }
      });

      // Extract dropoff directions from all cities
      const dropoffOptionsIda = tripData?.dropoffOptionsIda || (tripData as any)?.dropoffOptionsIda || [];
      dropoffOptionsIda.forEach((cityOpt: any) => {
        const cityDirections = cityOpt.directions || cityOpt.directions || [];
        cityDirections.forEach((dir: any) => {
          const id = dir.directionId || dir.directionId;
          const name = dir.displayName || dir.displayName;
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
      const pickupOptions = tripData?.pickupOptions || (tripData as any)?.pickupOptions || [];
      pickupOptions.forEach((opt: any) => {
        const id = opt.directionId || opt.directionId;
        const name = opt.displayName || opt.displayName;
        if (id != null) {
          directions.push({ id, name: `[Subida] ${name}`, type: 'pickup' });
        }
      });

      // Extract dropoff directions from all cities
      const dropoffOptionsIda = tripData?.dropoffOptionsIda || (tripData as any)?.dropoffOptionsIda || [];
      dropoffOptionsIda.forEach((cityOpt: any) => {
        const cityDirections = cityOpt.directions || cityOpt.directions || [];
        cityDirections.forEach((dir: any) => {
          const id = dir.directionId || dir.directionId;
          const name = dir.displayName || dir.displayName;
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

  const submitAddService = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        // Contrato ServiceCreateRequestDto: un slot único (dayOfWeek + departureHour).
        const transformedData = {
          name: data.name,
          tripId: data.tripId,
          vehicleId: data.vehicleId,
          dayOfWeek: Number(data.dayOfWeek),
          departureHour: data.departureHour + ':00', // HH:MM → HH:MM:SS (TimeSpan)
          estimatedDuration: data.estimatedDuration + ':00', // HH:MM → HH:MM:SS (TimeSpan)
          isHoliday: false,
          allowedDirectionIds: selectedDirectionIds.length > 0 ? selectedDirectionIds : null,
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
        }
      } catch (error) {
        // Surface backend error codes (validación de campos, conflictos de slot)
        // vía catálogo en español. Service.HasActiveSubscriptions etc también caen acá.
        bindApiErrorToForm(error, addForm.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(error).message,
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditService = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        // Contrato ServiceUpdateRequestDto: un slot único (dayOfWeek + departureHour).
        const transformedData = {
          name: data.name,
          tripId: data.tripId,
          vehicleId: data.vehicleId,
          dayOfWeek: Number(data.dayOfWeek),
          departureHour: data.departureHour + ':00', // HH:MM → HH:MM:SS (TimeSpan)
          estimatedDuration: data.estimatedDuration + ':00', // HH:MM → HH:MM:SS (TimeSpan)
          isHoliday: false,
          allowedDirectionIds: editSelectedDirectionIds.length > 0 ? editSelectedDirectionIds : null,
        };
        const response = await put(`/service-update/${currentServiceId}`, transformedData);
        if (response) {
          toast({
            title: 'Servicio actualizado',
            description: 'El servicio ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          refetch(); // Refresh the vehicle list
        }
      } catch (error) {
        // Especialmente importante acá: Service.VehicleCapacityBelowSubscriptions
        // (cuando cambian a un Vehicle más chico con subs activas) y
        // Service.HasActiveSubscriptions (cuando intentan desactivar).
        bindApiErrorToForm(error, editForm.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(error).message,
          variant: 'destructive',
        });
      }
    });
  };

  const submitAddTrip = async () => {
    tripForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          tripId: data.tripId,
          reserveDate: data.reserveDate,
          vehicleId: data.vehicleId,
          departureHour: data.departureHour + ':00', // Convert HH:MM to HH:MM:SS
          estimatedDuration: data.estimatedDuration + ':00', // Convert HH:MM to HH:MM:SS
          isHoliday: false,
          allowedDirectionIds: tripFormDirectionIds.length > 0 ? tripFormDirectionIds : null,
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
        }
      } catch (error) {
        // Subraya el campo culpable si el backend mandó errors[]/details
        // (e.g. Validation.VehicleId, Reserve.* con detalle de dirección).
        bindApiErrorToForm(error, tripForm.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(error).message,
          variant: 'destructive',
        });
      }
    });
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
    setCurrentServiceId(service.serviceId);
    // Convert TimeSpan format (HH:MM:SS) back to HH:MM for the time input
    const durationParts = service.estimatedDuration.split(':');
    const formattedDuration = `${durationParts[0]}:${durationParts[1]}`;

    editForm.setField('name', service.name);
    editForm.setField('tripId', service.tripId);
    editForm.setField('estimatedDuration', formattedDuration);
    // Modelo actual: un slot único. dayOfWeek se guarda como string ('0'..'6').
    editForm.setField('dayOfWeek', service.dayOfWeek != null ? String(service.dayOfWeek) : '');
    editForm.setField(
      'departureHour',
      service.departureHour ? service.departureHour.slice(0, 5) : '',
    );
    editForm.setField('vehicleId', service.vehicle.vehicleId);

    // Load directions for editing - extract IDs from AllowedDirections
    const existingDirectionIds = (service.allowedDirections || []).map(d => d.directionId);
    setEditSelectedDirectionIds(existingDirectionIds);
    loadTripDirections(service.tripId);

    setIsEditModalOpen(true);
    loadAllOptions();
  };

  const handleDeleteService = (id: number) => {
    setCurrentServiceId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteLogic(`/service-delete/${currentServiceId}`);
      setIsDeleteModalOpen(false);
      setCurrentServiceId(null);
      refetch();
    } catch (error) {
      // Si el Service tiene subs activas, el backend bloquea con
      // Service.HasActiveSubscriptions (409). Mostrar mensaje canónico
      // y dejar el modal abierto para que el admin pueda volver.
      toast({
        title: 'No se pudo eliminar',
        description: getApiErrorMessage(error).message,
        variant: 'destructive',
      });
    }
  };


  const columns = [
    { header: 'Nombre', accessor: 'name', width: '22%' },
    {
      header: 'Ruta Comercial',
      accessor: 'tripDescription',
      width: '22%',
      // Backend Mayo 2026 envía tripDescription directamente.
      // Fallback a tripName por si alguna respuesta vieja todavía lo trae.
      cell: (service: Service) => service.tripDescription || service.tripName || '-',
    },
    {
      header: 'Día y hora',
      accessor: 'dayOfWeek',
      width: '18%',
      // dayOfWeek + departureHour son flat ahora (schedulers[] fue removido
      // post-refactor ADR 0003: un Service = un slot único).
      cell: (service: Service) => formatServiceSlot(service) || '-',
    },
    {
      header: 'Duración Estimada',
      accessor: 'estimatedDuration',
      width: '13%',
      cell: (service: Service) =>
        service.estimatedDuration ? service.estimatedDuration.slice(0, 5) : '-',
    },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '10%',
      cell: (service: Service) => <StatusBadge status={service.status} />,
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
            onClick={() => handleDeleteService(service.serviceId)}
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
                data={data?.items ?? []}
                emptyMessage="No se encontraron servicios."
                isLoading={loading}
                skeletonRows={data?.pageSize}
              />
            </div>

            {data?.items?.length > 0 && (
              <TablePagination
                currentPage={pageNumber}
                totalPages={data?.totalPages}
                totalItems={data?.totalRecords}
                itemsPerPage={data?.pageSize}
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
        ) : data?.items?.length > 0 ? (
          data?.items?.map((service) => (
            <MobileCard
              key={service.serviceId}
              title={service.name}
              subtitle={service.serviceId.toString()}
              badge={<StatusBadge status={service.status ? 'Activo' : 'Inactivo'} />}
              fields={[
                { label: 'Ruta Comercial', value: service.tripDescription || service.tripName || '-' },
                { label: 'Día y hora', value: formatServiceSlot(service) || '-' },
                { label: 'Duración Estimada', value: service.estimatedDuration?.slice(0, 5) || '-' },
              ]}
              onEdit={() => handleEditService(service)}
              onDelete={() => handleDeleteService(service.serviceId)}
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
              <FormField label="Nombre" required error={addForm.errors.name}>
                <Input id="name" placeholder="Nombre" value={addForm.data.name} onChange={(e) => addForm.setField('name', e.target.value)} />
              </FormField>
            </div>
            <div className="w-full">
              <FormField label="Ruta Comercial" required error={addForm.errors.tripId}>
                <ApiSelect
                  value={String(addForm.data.tripId)}
                  onValueChange={(value) => {
                    const tripId = Number(value);
                    addForm.setField('tripId', tripId);
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
              <FormField label="Día" required error={addForm.errors.dayOfWeek}>
                <Select value={String(addForm.data.dayOfWeek)} onValueChange={(value) => addForm.setField('dayOfWeek', value)}>
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
              <FormField label="Hora de Partida" required error={addForm.errors.departureHour}>
                <Input
                  id="departureHour"
                  type="time"
                  placeholder="HH:MM"
                  value={addForm.data.departureHour}
                  onChange={(e) => addForm.setField('departureHour', e.target.value)}
                />
              </FormField>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Duración Estimada (HH:MM)" required error={addForm.errors.estimatedDuration}>
                <Input
                  id="estimatedDuration"
                  type="time"
                  placeholder="HH:MM"
                  value={addForm.data.estimatedDuration}
                  onChange={(e) => addForm.setField('estimatedDuration', e.target.value)}
                />
              </FormField>
              <FormField label="Vehículo" required error={addForm.errors.vehicleId}>
                <ApiSelect
                  value={String(addForm.data.vehicleId)}
                  onValueChange={(value) => addForm.setField('vehicleId', Number(value))}
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

            {/* Directions Whitelist */}
            {addForm.data.tripId > 0 && (
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
              <FormField label="Día" required error={editForm.errors.dayOfWeek}>
                <Select value={String(editForm.data.dayOfWeek)} onValueChange={(value) => editForm.setField('dayOfWeek', value)}>
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
              <FormField label="Hora de Partida" required error={editForm.errors.departureHour}>
                <Input
                  id="edit-departureHour"
                  type="time"
                  placeholder="HH:MM"
                  value={editForm.data.departureHour}
                  onChange={(e) => editForm.setField('departureHour', e.target.value)}
                />
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
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio y todos los datos asociados de nuestros servidores."
      />
    </div>
  );
}
