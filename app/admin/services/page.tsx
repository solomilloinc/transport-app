'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
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
  schedules: [] as ServiceSchedule[],
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
  name: { required: true, message: 'El nombre es requerido' },
  originId: { required: true, message: 'El origen es requerido' },
  destinationId: { required: true, message: 'El destino es requerido' },
  startDay: { required: true, message: 'El día de inicio es requerido' },
  endDay: { required: true, message: 'El día de fin es requerido' },
  estimatedDuration: { required: true, message: 'La duración estimada es requerida' },
  departureHour: { required: true, message: 'La hora de partida es requerida' },
  isHoliday: { required: true, message: 'El estado de feriado es requerido' },
  vehicleId: { required: true, message: 'El vehículo es requerido' },
};

export default function ServiceManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);
  const addForm = useFormValidation(emptyService, validationSchema);
  const editForm = useFormValidation(initialService, validationSchema);
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
        const response = await post('/service-create', data);
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
    addForm.handleSubmit(async (data) => {
      try {
        const response = await put(`/service-update/${currentServiceId}`, data);
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

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const updatedSchedules = [...addForm.data.Schedules];
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value,
    };
    addForm.setField('Schedules', updatedSchedules);
  };

  const handleAddService = () => {
    setCurrentServiceId(null);
    addForm.resetForm();
    setIsAddModalOpen(true);
    loadAllOptions();
  };

  const handleEditService = (service: Service) => {
    setCurrentServiceId(service.ServiceId);
    editForm.setField('name', service.Name);
    editForm.setField('originId', service.OriginId);
    editForm.setField('destinationId', service.DestinationId);
    editForm.setField('estimatedDuration', service.EstimatedDuration);
    editForm.setField('vehicleId', service.Vehicle.VehicleId);
    setEditSchedules(service.Schedules || []);
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
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
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
          <Button onClick={() => handleAddService()}>
            <Wrench className="mr-2 h-4 w-4" />
            Añadir Servicio
          </Button>
        }
      />
      {loading && data?.Items?.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <Skeleton className="h-8 w-48" />
              </div>
            ) : (

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
                isLoading={isLoading}
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
       )}

      {/* Mobile view - Card layout */}
      <div className="md:hidden space-y-4 mt-4">
        {isLoading && data?.Items?.length === 0  ? (
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
        title="Añadir nuevo servicio"
        description="Crea un nuevo servicio completando el formulario a continuación."
        onSubmit={() => submitAddService()}
        submitText="Crear Servicio"
      >
        <div className="w-full">
          <div className="grid grid-cols-1 gap-4">
            {/* Información Personal */}
            <div className="w-full">
              <FormField label="Nombre" required error={addForm.errors.Name}>
                <Input id="name" placeholder="Nombre" value={addForm.data.Name} onChange={(e) => addForm.setField('name', e.target.value)} />
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
              <FormField label="Duración Estimada" required error={addForm.errors.EstimatedDuration}>
                <Input
                  id="estimatedDuration"
                  placeholder="Duración Estimada"
                  value={addForm.data.EstimatedDuration}
                  onChange={(e) => addForm.setField('EstimatedDuration', e.target.value)}
                />
              </FormField>
              <FormField label="Vehículo" required error={addForm.errors.vehicleId}>
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
                {addForm.data.Schedules.map((schedule, index) => (
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
                          onValueChange={(value) => handleScheduleChange(index, 'IsHoliday', Number.parseInt(value))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No</SelectItem>
                            <SelectItem value="1">Sí</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {addForm.data.Schedules.length > 1 && (
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
                <Select onValueChange={(value) => editForm.setField('startDay', value)}>
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
                <Select onValueChange={(value) => editForm.setField('endDate', value)}>
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
              <FormField label="Duración Estimada" required error={editForm.errors.estimatedDuration}>
                <Input
                  id="edit-estimatedDuration"
                  value={editForm.data.estimatedDuration}
                  onChange={(e) => editForm.setField('estimatedDuration', e.target.value)}
                />
              </FormField>
              <FormField label="Hora de Partida">
                <Input
                  id="edit-departureHour"
                  value={editForm.data.departureHour}
                  onChange={(e) => editForm.setField('departureHour', e.target.value)}
                />
              </FormField>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Feriado" required error={editForm.errors.isHoliday}>
                <Select onValueChange={(value) => editForm.setField('isHoliday', value === 'true')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y todos los datos asociados de nuestros servidores."
      />
    </div>
  );
}
