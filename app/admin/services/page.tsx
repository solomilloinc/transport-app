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
import { SearchFilter } from '@/components/dashboard/search-filter';
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
import { City } from '@/interfaces/city';
import { Vehicle } from '@/interfaces/vehicle';
import { useFormValidation } from '@/hooks/use-form-validation';
import { getOptionIdByValue } from '@/utils/form-options';
import { emptyServiceSchedule, ServiceSchedule } from '@/interfaces/serviceSchedule';
import { Label } from '@/components/ui/label';
import { usePaginationParams } from '@/utils/pagination';
import { useApi } from '@/hooks/use-api';
import { getServices } from '@/services/service';

const initialService = {
  name: '',
  originId: 0,
  destinationId: 0,
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
  OriginId: { required: true, message: 'El origen es requerido' },
  DestinationId: { required: true, message: 'El destino es requerido' },
  StartDay: { required: true, message: 'El día de inicio es requerido' },
  EndDay: { required: true, message: 'El día de fin es requerido' },
  EstimatedDuration: { required: true, message: 'La duración estimada es requerida' },
  VehicleId: { required: true, message: 'El vehículo es requerido' },
};

const editValidationSchema = {
  name: { required: true, message: 'El nombre es requerido' },
  originId: { required: true, message: 'El origen es requerido' },
  destinationId: { required: true, message: 'El destino es requerido' },
  startDay: { required: true, message: 'El día de inicio es requerido' },
  endDay: { required: true, message: 'El día de fin es requerido' },
  estimatedDuration: { required: true, message: 'La duración estimada es requerida' },
  vehicleId: { required: true, message: 'El vehículo es requerido' },
};

const tripValidationSchema = {
  originId: { required: true, message: 'El origen es requerido' },
  destinationId: { required: true, message: 'El destino es requerido' },
  departureHour: { required: true, message: 'La hora de partida es requerida' },
  vehicleId: { required: true, message: 'El vehículo es requerido' },
  estimatedDuration: { required: true, message: 'La duración estimada es requerida' },
  reserveDate: { required: true, message: 'La fecha es requerida' },
};

const initialTripForm = {
  originId: 0,
  destinationId: 0,
  departureHour: '10:00',
  vehicleId: 0,
  estimatedDuration: '01:00',
  reserveDate: format(new Date(), 'yyyy-MM-dd'),
};

export default function ServiceManagement() {
  const [searchQuery, setSearchQuery] = useState('');

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);
  const addForm = useFormValidation(emptyService, validationSchema);
  const editForm = useFormValidation(initialService, editValidationSchema);
  const tripForm = useFormValidation(initialTripForm, tripValidationSchema);
  const [cities, setCities] = useState<SelectOption[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [editSchedules, setEditSchedules] = useState<ServiceSchedule[]>([]);

   const params = usePaginationParams({
      pageNumber: currentPage,
      filters: { search: searchQuery },
    });
  
    const { data, loading, error, fetch } = useApi<Service, PaginationParams>(getServices, {
      autoFetch: true,
      params: params,
    });

  const loadAllOptions = async () => {
    try {
      setIsOptionsLoading(true);
      setOptionsError(null);

      // Llamadas API (pueden ir en paralelo)
      const [cityResponse, vehicleResponse] = await Promise.all([
        get<any, PagedResponse<City>>('/city-report', {
          pageNumber: 1,
          pageSize: 10,
          sortBy: 'fecha',
          sortDescending: true,
          filters: searchQuery ? { search: searchQuery } : {},
        }),
        get<any, PagedResponse<Vehicle>>('/vehicle-report', {
          pageNumber: 1,
          pageSize: 10,
          sortBy: 'fecha',
          sortDescending: true,
          filters: searchQuery ? { search: searchQuery } : {},
        }),
      ]);

      // Cargar ciudades
      if (cityResponse) {
        const formattedCities = cityResponse.Items.map((city: City) => ({
          id: city.Id.toString(),
          value: city.Id.toString(),
          label: city.Name,
        }));
        setCities(formattedCities);
      }

      // Cargar vehículos
      if (vehicleResponse) {
        const formattedVehicles = vehicleResponse.Items.map((vehicle: Vehicle) => ({
          id: vehicle.VehicleTypeId.toString(),
          value: vehicle.VehicleTypeId.toString(),
          label: vehicle.VehicleTypeName + vehicle.InternalNumber,
        }));
        setVehicles(formattedVehicles);
      }
    } catch (error) {
      setOptionsError('Error al cargar las ciudades o los tipos de vehículos');
    } finally {
      setIsOptionsLoading(false);
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
          }))
        };
        const response = await post('/service-create', transformedData);
        if (response) {
          toast({
            title: 'Servicio creado',
            description: 'El servicio ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetch({ pageNumber: currentPage }); // Refresh the vehicle list
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
          OriginId: data.originId,
          DestinationId: data.destinationId,
          EstimatedDuration: data.estimatedDuration + ':00', // Convert HH:MM to HH:MM:SS format
          StartDay: data.startDay,
          EndDay: data.endDay,
          VehicleId: data.vehicleId,
          Schedules: editSchedules.map(schedule => ({
            ...schedule,
            DepartureHour: schedule.DepartureHour.includes(':')
              ? schedule.DepartureHour + ':00'
              : schedule.DepartureHour // Convert HH:MM to HH:MM:SS format
          }))
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
          fetch({ pageNumber: currentPage }); // Refresh the vehicle list
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
          ...data,
          EstimatedDuration: data.estimatedDuration + ':00', // Convert HH:MM to HH:MM:SS
          DepartureHour: data.departureHour + ':00', // Convert HH:MM to HH:MM:SS
          // ReserveDate ya viene en formato yyyy-MM-dd del input date
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
    editForm.setField('originId', service.OriginId);
    editForm.setField('destinationId', service.DestinationId);
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
    fetch({ pageNumber: currentPage });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Nombre', accessor: 'Name', width: '15%' },
    { header: 'Origen', accessor: 'OriginName', width: '20%' },
    { header: 'Destino', accessor: 'DestinationName', width: '20%' },
    { header: 'Duración Estimada', accessor: 'EstimatedDuration', width: '20%' },
    { header: 'Hora de partida', accessor: 'DepartureHour', width: '20%' },
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
            <FilterBar onReset={resetFilters}>
              <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por nombre..." />
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
                currentPage={currentPage}
                totalPages={data?.TotalPages}
                totalItems={data?.TotalRecords}
                itemsPerPage={data?.PageSize}
                onPageChange={setCurrentPage}
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
                { label: 'Origen', value: service.OriginName },
                { label: 'Destino', value: service.DestinationName },
                { label: 'Duración Estimada', value: service.EstimatedDuration },
                // { label: 'Hora de Partida', value: service.DepartureHour },
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
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Origen" required error={addForm.errors.OriginId}>
                <ApiSelect
                  value={String(addForm.data.OriginId)}
                  onValueChange={(value) => addForm.setField('OriginId', Number(value))}
                  placeholder="Seleccionar origen"
                  options={cities}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando ciudades..."
                  errorMessage="Error al cargar las ciudades"
                  emptyMessage="No hay ciudades disponibles"
                />
              </FormField>
              <FormField label="Destino" required error={addForm.errors.DestinationId}>
                <ApiSelect
                  value={String(addForm.data.DestinationId)}
                  onValueChange={(value) => addForm.setField('DestinationId', Number(value))}
                  placeholder="Seleccionar destino"
                  options={cities.filter((city) => city.id !== String(addForm.data.OriginId))}
                  disabled={addForm.data.OriginId === 0}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando destinos..."
                  errorMessage="Error al cargar los destinos"
                  emptyMessage="No hay destinos disponibles"
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
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Origen" required error={editForm.errors.originId}>
                <ApiSelect
                  value={String(editForm.data.originId)}
                  onValueChange={(value) => editForm.setField('originId', Number(value))}
                  placeholder="Seleccionar origen"
                  options={cities}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando ciudades..."
                  errorMessage="Error al cargar las ciudades"
                  emptyMessage="No hay ciudades disponibles"
                />
              </FormField>
              <FormField label="Destino" required error={editForm.errors.destinationId}>
                <ApiSelect
                  value={String(editForm.data.destinationId)}
                  onValueChange={(value) => editForm.setField('destinationId', Number(value))}
                  placeholder="Seleccionar destino"
                  options={cities.filter((city) => city.id !== String(editForm.data.originId))}
                  disabled={editForm.data.originId === 0}
                  loading={isOptionsLoading}
                  error={optionsError}
                  loadingMessage="Cargando destinos..."
                  errorMessage="Error al cargar los destinos"
                  emptyMessage="No hay destinos disponibles"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Origen" required error={tripForm.errors.originId}>
              <ApiSelect
                value={String(tripForm.data.originId)}
                onValueChange={(value) => tripForm.setField('originId', Number(value))}
                placeholder="Seleccionar origen"
                options={cities}
                loading={isOptionsLoading}
                error={optionsError}
                loadingMessage="Cargando ciudades..."
                errorMessage="Error al cargar las ciudades"
                emptyMessage="No hay ciudades disponibles"
              />
            </FormField>
            <FormField label="Destino" required error={tripForm.errors.destinationId}>
              <ApiSelect
                value={String(tripForm.data.destinationId)}
                onValueChange={(value) => tripForm.setField('destinationId', Number(value))}
                placeholder="Seleccionar destino"
                options={cities.filter((city) => city.id !== String(tripForm.data.originId))}
                disabled={tripForm.data.originId === 0}
                loading={isOptionsLoading}
                error={optionsError}
                loadingMessage="Cargando destinos..."
                errorMessage="Error al cargar los destinos"
                emptyMessage="No hay destinos disponibles"
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
