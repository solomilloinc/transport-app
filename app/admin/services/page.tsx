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
import {
  emptyServiceSchedule,
  ServiceSchedule,
  ServiceScheduleDraft,
} from '@/interfaces/serviceSchedule';
import { Label } from '@/components/ui/label';
import { getServiceReport } from '@/services/service';
import { getServiceSchedules } from '@/services/service-schedules';
import { DAYS_OF_WEEK_OPTIONS } from '@/utils/days-of-week';
import { formatOperatingDays } from '@/utils/format-operating-days';
import {
  SchedulesEditor,
  SchedulesEditorHandle,
  toApiHour,
  isHourValid,
} from '@/components/admin/services/SchedulesEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  startDay: null as number | null,
  endDay: null as number | null,
  estimatedDuration: '',
  departureHour: '',
  isHoliday: false,
  vehicleId: 0,
  Schedules: [] as ServiceSchedule[], // Keep as Schedules for form consistency
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

  const [schedules, setSchedules] = useState<ServiceScheduleDraft[]>([]);
  const [editSchedules, setEditSchedules] = useState<ServiceScheduleDraft[]>([]);
  const addSchedulesEditorRef = useRef<SchedulesEditorHandle>(null);
  const editSchedulesEditorRef = useRef<SchedulesEditorHandle>(null);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

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

  const submitAddService = async () => {
    const editorDrafts = addSchedulesEditorRef.current?.getDrafts() ?? schedules;
    if (editorDrafts.length === 0 || !editorDrafts.every((d) => isHourValid(d.DepartureHour))) {
      toast({
        title: 'Horarios inválidos',
        description: 'Agregá al menos un horario válido (> 00:00) antes de crear.',
        variant: 'destructive',
      });
      return;
    }
    addForm.handleSubmit(async (data) => {
      try {
        // Transform the data to match the API expectations
        const transformedData = {
          Name: data.Name,
          TripId: data.TripId,
          EstimatedDuration: data.EstimatedDuration + ':00', // Convert HH:MM to HH:MM:SS format
          VehicleId: data.VehicleId,
          StartDay: data.StartDay,
          EndDay: data.EndDay,
          Schedules: editorDrafts.map((d) => ({
            DepartureHour: toApiHour(d.DepartureHour),
            IsHoliday: d.IsHoliday,
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
    editForm.handleSubmit(async (data) => {
      try {
        // Transform the data to match the API expectations.
        // NOTE: the new backend contract for PUT /service-update/{id} does NOT
        // accept schedules — they live on PUT /service-schedules-sync/{id}
        // via the SchedulesEditor (mode='synced').
        const transformedData = {
          Name: data.name,
          TripId: data.tripId,
          EstimatedDuration: data.estimatedDuration + ':00', // Convert HH:MM to HH:MM:SS format
          StartDay: data.startDay,
          EndDay: data.endDay,
          VehicleId: data.vehicleId,
          AllowedDirectionIds: editSelectedDirectionIds.length > 0 ? editSelectedDirectionIds : null,
        };
        const response = await put(`/service-update/${currentServiceId}`, transformedData);
        if (response) {
          toast({
            title: 'Servicio actualizado',
            description: 'El servicio ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          refetch();
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el servicio',
            variant: 'destructive',
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Trip.NotFound')) {
          (editForm as any).errors && ((editForm as any).errors.tripId = 'El trip seleccionado no existe.');
          toast({
            title: 'Trip no encontrado',
            description: 'El trip seleccionado no existe.',
            variant: 'destructive',
          });
        } else if (message.includes('Trip.NotActive')) {
          (editForm as any).errors && ((editForm as any).errors.tripId = 'El trip seleccionado está inactivo.');
          toast({
            title: 'Trip inactivo',
            description: 'El trip seleccionado está inactivo.',
            variant: 'destructive',
          });
        } else if (message.includes('Validation.TripId')) {
          toast({
            title: 'Trip inválido',
            description: 'Debe seleccionar un trip válido.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Ocurrió un error al actualizar el servicio',
            variant: 'destructive',
          });
        }
      }
    });
  };

  /**
   * Refetches the live schedules of the currently edited Service from the
   * backend so the SchedulesEditor picks up real ServiceScheduleIds assigned
   * by the bulk sync.
   */
  const refetchEditSchedules = async () => {
    if (!currentServiceId) return;
    try {
      const fresh = await getServiceSchedules(currentServiceId);
      const normalized: ServiceScheduleDraft[] = (fresh ?? []).map((s) => ({
        ServiceScheduleId: s.ServiceScheduleId,
        DepartureHour: s.DepartureHour.includes(':')
          ? s.DepartureHour.split(':').slice(0, 2).join(':')
          : s.DepartureHour,
        IsHoliday: s.IsHoliday,
      }));
      setEditSchedules(normalized);
      editSchedulesEditorRef.current?.reset(normalized);
    } catch (error) {
      console.error('Error refetching schedules:', error);
    }
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

  const handleAddService = () => {
    setCurrentServiceId(null);
    addForm.resetForm();
    setSchedules([]);
    addSchedulesEditorRef.current?.reset([]);
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

    editForm.setField('name', service.Name);
    editForm.setField('tripId', service.TripId);
    editForm.setField('estimatedDuration', formattedDuration);
    // System.DayOfWeek accepts 0 (Domingo) as valid — so check for null/undefined explicitly.
    editForm.setField(
      'startDay',
      service.StartDay !== null && service.StartDay !== undefined ? service.StartDay : null,
    );
    editForm.setField(
      'endDay',
      service.EndDay !== null && service.EndDay !== undefined ? service.EndDay : null,
    );
    editForm.setField('vehicleId', service.Vehicle.VehicleId);

    // Normalize schedules from API response to ServiceScheduleDraft for the SchedulesEditor.
    const schedulers = service.Schedulers || [];
    const normalized: ServiceScheduleDraft[] = schedulers.map((s) => ({
      ServiceScheduleId: s.ServiceScheduleId,
      DepartureHour: s.DepartureHour?.includes(':')
        ? s.DepartureHour.split(':').slice(0, 2).join(':')
        : s.DepartureHour || '',
      IsHoliday: !!s.IsHoliday,
    }));
    setEditSchedules(normalized);
    editSchedulesEditorRef.current?.reset(normalized);

    // Load directions for editing - extract IDs from AllowedDirections
    const existingDirectionIds = (service.AllowedDirections || []).map(d => d.DirectionId);
    setEditSelectedDirectionIds(existingDirectionIds);
    loadTripDirections(service.TripId);

    setIsEditModalOpen(true);
    loadAllOptions();
  };

  /**
   * Guard closing the Edit dialog when the schedules sub-panel has unsaved changes.
   * Shows an AlertDialog to confirm discard.
   */
  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open && editSchedulesEditorRef.current?.isDirty()) {
      setIsConfirmCloseOpen(true);
      return;
    }
    setIsEditModalOpen(open);
  };

  const confirmDiscardEditChanges = () => {
    editSchedulesEditorRef.current?.reset(editSchedules);
    setIsConfirmCloseOpen(false);
    setIsEditModalOpen(false);
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
    { header: 'Nombre', accessor: 'Name', width: '20%' },
    {
      header: 'Ruta Comercial',
      accessor: 'TripName',
      width: '20%',
      cell: (service: Service) => service.TripName || '-',
    },
    { header: 'Duración Estimada', accessor: 'EstimatedDuration', width: '15%' },
    {
      header: 'Días operativos',
      accessor: 'operatingDays',
      width: '15%',
      cell: (service: Service) => formatOperatingDays(service.StartDay, service.EndDay),
    },
    {
      header: 'Hora de partida',
      accessor: 'DepartureHour',
      width: '15%',
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
      width: '15%',
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
                { label: 'Días operativos', value: formatOperatingDays(service.StartDay, service.EndDay) },
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
              <FormField label="Día de inicio" required error={addForm.errors.StartDay}>
                <Select
                  value={addForm.data.StartDay != null ? String(addForm.data.StartDay) : ''}
                  onValueChange={(value) => addForm.setField('StartDay', Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccioná un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Día de fin" required error={addForm.errors.EndDay}>
                <Select
                  value={addForm.data.EndDay != null ? String(addForm.data.EndDay) : ''}
                  onValueChange={(value) => addForm.setField('EndDay', Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccioná un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
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
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <SchedulesEditor
                ref={addSchedulesEditorRef}
                mode="buffered"
                value={schedules}
                onChange={setSchedules}
              />
              {schedules.length === 0 && (
                <p className="text-xs text-destructive">
                  Agregá al menos un horario de partida.
                </p>
              )}
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
        onOpenChange={handleEditDialogOpenChange}
        title="Editar servicio"
        description="Realiza cambios en los detalles del servicio a continuación."
        onSubmit={() => submitEditService()}
        submitText="Guardar servicio"
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
              <p className="text-xs text-muted-foreground mt-1">
                Las reservas ya generadas conservarán la ruta anterior; solo las reservas futuras usarán la nueva ruta.
              </p>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Día de inicio" required error={editForm.errors.startDay}>
                <Select
                  value={editForm.data.startDay != null ? String(editForm.data.startDay) : ''}
                  onValueChange={(value) => editForm.setField('startDay', Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccioná un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Día de fin" required error={editForm.errors.endDay}>
                <Select
                  value={editForm.data.endDay != null ? String(editForm.data.endDay) : ''}
                  onValueChange={(value) => editForm.setField('endDay', Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccioná un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
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
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Los horarios se guardan por separado. Editá, agregá o eliminá y luego clickeá <b>Guardar horarios</b>.
              </p>
              <SchedulesEditor
                ref={editSchedulesEditorRef}
                mode="synced"
                value={editSchedules}
                onChange={setEditSchedules}
                serviceId={currentServiceId ?? undefined}
                onSaved={refetchEditSchedules}
              />
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

      <AlertDialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tenés horarios sin guardar. Si cerrás ahora se perderán los cambios del panel de horarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardEditChanges}>
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
