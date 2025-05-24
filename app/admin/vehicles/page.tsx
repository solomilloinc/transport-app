'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Bus, Edit, Plus, Search, Trash, TruckIcon, UserPlusIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteLogic, get, post, put } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { SearchFilter } from '@/components/dashboard/search-filter';
import { StatusFilter } from '@/components/dashboard/status-filter';
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
import { PagedResponse } from '@/services/types';
import { ApiSelect, type SelectOption } from '@/components/dashboard/select';
import { VehicleType } from '@/interfaces/vehicleType';
import { Vehicle } from '@/interfaces/vehicle';
import { useFormValidation } from '@/hooks/use-form-validation';

const initialVehicleForm = {
  vehicleTypeId: 0,
  internalNumber: '',
  availableQuantity: 0,
};

const validationConfig = {
  vehicleTypeId: {
    required: true,
    message: 'El tipo de vehículo es requerido',
  },
  internalNumber: {
    required: true,
    message: 'El número interno es requerido',
  },
  availableQuantity: {
    required: true,
    message: 'La cantidad disponible es requerida',
  },
};

export default function VehicleManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentVehicleId, setCurrentVehicleId] = useState<number | null>(null);

  const addForm = useFormValidation(initialVehicleForm, validationConfig);

  // Form state for editing a vehicle
  const editForm = useFormValidation(initialVehicleForm, validationConfig);
  const [vehicleTypes, setVehicleTypes] = useState<SelectOption[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // State for the paged response
  const [vehiclesData, setVehiclesData] = useState<PagedResponse<Vehicle>>({
    Items: [],
    PageNumber: 1,
    PageSize: 8,
    TotalRecords: 0,
    TotalPages: 0,
  });
  // Function to fetch vehicles data
  const fetchVehicles = async (pageToFetch = currentPage, pageSizeToFetch = pageSize) => {
    setIsLoading(true);
    try {
      const response = await get<any, Vehicle>('/vehicle-report', {
        pageNumber: pageToFetch,
        pageSize: pageSizeToFetch,
        sortBy: 'fecha',
        sortDescending: true,
        filters: searchQuery ? { search: searchQuery } : {},
      });
      setVehiclesData(response);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    fetchVehicles(currentPage, pageSize);
  }, [searchQuery, pageSize, currentPage]);

  const loadAllOptions = async () => {
    try {
      setIsOptionsLoading(true);
      setOptionsError(null);
      const response = await get<any, VehicleType>('/vehicle-type-report', {
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'fecha',
        sortDescending: true,
        filters: searchQuery ? { search: searchQuery } : {},
      });
      if (response) {
        const formattedTypes = response.Items.map((type: VehicleType) => ({
          id: type.VehicleTypeId.toString(),
          value: type.VehicleTypeId.toString(),
          label: type.Name,
          defaultQuantity: type.Quantity.toString(),
        }));
        setVehicleTypes(formattedTypes);
      }
    } catch (error) {
      setOptionsError('Error al cargar los tipos de vehículos');
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const submitAddVehicle = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/vehicle-create', data);
        if (response) {
          toast({
            title: 'Vehículo creado',
            description: 'El vehículo ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetchVehicles(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el vehículo',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el vehículo',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditVehicle = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const response = await put(`/vehicle-update/${currentVehicleId}`, data);
        if (response) {
          toast({
            title: 'Vehículo actualizado',
            description: 'El vehículo ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetchVehicles(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el vehículo',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar el vehículo',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddVehicle = () => {
    setCurrentVehicleId(null);
    addForm.resetForm();
    setIsAddModalOpen(true);
    loadAllOptions();
  };

  const handleSetVehicleType = (value: string, quantity?: string) => {
    addForm.setField('vehicleTypeId', Number(value));
    addForm.setField('availableQuantity', Number(quantity));
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setCurrentVehicleId(vehicle.VehicleId);
    editForm.setField('vehicleTypeId', vehicle.VehicleTypeId);
    editForm.setField('availableQuantity', vehicle.AvailableQuantity);
    editForm.setField('internalNumber', vehicle.InternalNumber);
    setIsEditModalOpen(true);
    loadAllOptions();
  };

  const handleDeleteVehicle = (id: number) => {
    setCurrentVehicleId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/vehicle-delete/${currentVehicleId}`);
    // In a real app, you would delete the vehicle from the database
    setIsDeleteModalOpen(false);
    setCurrentVehicleId(null);
    fetchVehicles();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Nombre', accessor: 'VehicleTypeName', width: '30%' },
    { header: 'Numero Interno', accessor: 'InternalNumber', width: '15%' },
    {
      header: 'Capacidad',
      accessor: 'capacity',
      cell: (vehicle: Vehicle) => <>{vehicle.AvailableQuantity} asientos</>,
      hidden: true,
      width: '15%',
    },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '20%',
      cell: (vehicle: Vehicle) => <StatusBadge status={vehicle.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '20%',
      cell: (vehicle: Vehicle) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditVehicle(vehicle)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeleteVehicle(vehicle.VehicleId)}
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
        title="Vehiculos"
        description="Gestiona y visualiza toda la información de los vehiculos"
        action={
          <Button onClick={() => handleAddVehicle()}>
            <TruckIcon className="mr-2 h-4 w-4" />
            Añadir Vehiculo
          </Button>
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
                data={vehiclesData.Items}
                emptyMessage="No se encontraron vehiculos."
                isLoading={isLoading}
                skeletonRows={vehiclesData.PageSize}
              />
            </div>

            {vehiclesData.Items.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={vehiclesData.TotalPages}
                totalItems={vehiclesData.TotalRecords}
                itemsPerPage={vehiclesData.PageSize}
                onPageChange={setCurrentPage}
                itemName="vehiculos"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile view - Card layout */}
      <div className="md:hidden space-y-4 mt-4">
        {isLoading ? (
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
        ) : vehiclesData.Items.length > 0 ? (
          vehiclesData.Items.map((vehicle) => (
            <MobileCard
              key={vehicle.VehicleId}
              title={vehicle.VehicleTypeName}
              subtitle={vehicle.VehicleId.toString()}
              badge={<StatusBadge status={vehicle.Status ? 'Activo' : 'Inactivo'} />}
              fields={[
                { label: 'Numero de interno', value: vehicle.InternalNumber },
                { label: 'Capacidad', value: vehicle.AvailableQuantity },
              ]}
              onEdit={() => handleEditVehicle(vehicle)}
              onDelete={() => handleDeleteVehicle(vehicle.VehicleId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron vehiculos.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir Nuevo Vehiculo"
        description="Crea un nuevo vehiculo completando el formulario a continuación."
        onSubmit={() => submitAddVehicle()}
        submitText="Crear Vehiculo"
        isLoading={addForm.isSubmitting}
      >
        <FormField label="Tipo" required error={addForm.errors.vehicleTypeId}>
          <ApiSelect
            value={String(addForm.data.vehicleTypeId)}
            onValueChange={(value) =>
              handleSetVehicleType(value, vehicleTypes.find((type) => type.id === value)?.defaultQuantity)
            }
            placeholder="Seleccionar tipo"
            options={vehicleTypes}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando tipos de vehículos..."
            errorMessage="Error al cargar los tipos"
            emptyMessage="No hay tipos disponibles"
          />
        </FormField>
        <FormField label="Capacidad disponible" required error={addForm.errors.availableQuantity}>
          <Input
            id="availableQuantity"
            placeholder="Cantidad disponible"
            value={addForm.data.availableQuantity}
            onChange={(e) => addForm.setField('availableQuantity', Number(e.target.value))}
          />
        </FormField>
        <FormField label="Interno" required error={addForm.errors.internalNumber}>
          <Input
            id="internalNumber"
            placeholder="Número de interno"
            value={addForm.data.internalNumber}
            onChange={(e) => addForm.setField('internalNumber', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Edit Customer Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Vehículo"
        description="Realiza cambios en los detalles del vehículo a continuación."
        onSubmit={() => submitEditVehicle()}
        submitText="Guardar Cambios"
        isLoading={editForm.isSubmitting}
      >
        <FormField label="Tipo" required error={editForm.errors.vehicleTypeId}>
          <ApiSelect
            value={String(editForm.data.vehicleTypeId)}
            onValueChange={(value) => {
              handleSetVehicleType(value, vehicleTypes.find((type) => type.id === value)?.defaultQuantity);
            }}
            placeholder="Seleccionar tipo"
            options={vehicleTypes}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando tipos de vehículos..."
            errorMessage="Error al cargar los tipos"
            emptyMessage="No hay tipos disponibles"
          />
        </FormField>
        <FormField label="Capacidad disponible" required error={editForm.errors.availableQuantity}>
          <Input
            id="availableQuantity"
            placeholder="Cantidad disponible"
            value={editForm.data.availableQuantity}
            onChange={(e) => editForm.setField('availableQuantity', Number(e.target.value))}
          />
        </FormField>

        <FormField label="Numero de Interno" required error={editForm.errors.internalNumber}>
          <Input
            id="edit-internalNumber"
            value={editForm.data.internalNumber}
            onChange={(e) => editForm.setField('internalNumber', e.target.value)}
          />
        </FormField>
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
