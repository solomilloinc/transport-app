'use client';

import type React from 'react';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Bus, Edit, Plus, Search, Trash, TruckIcon, UserPlusIcon } from 'lucide-react';
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
import { DeleteDialog } from '@/components/dashboard/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { PagedResponse, PaginationParams } from '@/services/types';
import { emptyVehicleType, VehicleType } from '@/interfaces/vehicleType';
import { maxLengthRule, maxValueRule, minLengthRule, minValueRule } from '@/utils/validation-rules';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useApi } from '@/hooks/use-api';
import { getTypesVehicle } from '@/services/vehicle';
import { usePaginationParams } from '@/utils/pagination';
import { validationConfig } from '@/validations/vehicletTypeSchema';

export default function VehicleManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentVehicleTypeId, setCurrentVehicleTypeId] = useState<number | null>(null);
  const addForm = useFormValidation(emptyVehicleType, validationConfig);
  const editForm = useFormValidation(emptyVehicleType, validationConfig);

  const params = usePaginationParams({
    pageNumber: currentPage,
    filters: { search: searchQuery },
  });

  const { loading, data, error, fetch } = useApi<VehicleType, PaginationParams>(getTypesVehicle, {
    autoFetch: true,
    params: params,
  });
  const submitAddTypeVehicle = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/vehicle-type-create', data);
        if (response) {
          toast({
            title: 'Vehículo creado',
            description: 'El vehículo ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetch(params); // Refresh the vehicle list
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

  const submitEditTypeVehicle = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const response = await put(`/vehicle-type-update/${currentVehicleTypeId}`, data);
        if (response) {
          toast({
            title: 'Vehículo actualizado',
            description: 'El vehículo ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetch(params); // Refresh the vehicle list
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

  const handleAddTypeVehicle = () => {
    setCurrentVehicleTypeId(null);
    setIsAddModalOpen(true);
    addForm.resetForm();
  };

  const handleEditTypeVehicle = (vehicle: VehicleType) => {
    setCurrentVehicleTypeId(vehicle.VehicleTypeId);
    editForm.setField('Name', vehicle.Name);
    editForm.setField('Quantity', vehicle.Quantity);
    setIsEditModalOpen(true);
  };

  const handleDeleteTypeVehicle = (id: number) => {
    setCurrentVehicleTypeId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/vehicle-delete/${currentVehicleTypeId}`);
    // In a real app, you would delete the vehicle from the database
    setIsDeleteModalOpen(false);
    setCurrentVehicleTypeId(null);
    //fetchTypeVehicles();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Nombre', accessor: 'Name', width: '40%' },
    { header: 'Cantidad', accessor: 'Quantity', width: '15%' },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '20%',
      cell: (vehicle: VehicleType) => <StatusBadge status={vehicle.status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '25%',
      cell: (vehicle: VehicleType) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditTypeVehicle(vehicle)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeleteTypeVehicle(vehicle.VehicleTypeId)}
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
        title="Tipos de Vehiculos"
        description="Gestiona y visualiza toda la información de los tipos de vehiculos"
        action={
          <Button onClick={() => handleAddTypeVehicle()}>
            <TruckIcon className="mr-2 h-4 w-4" />
            Agregar
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
                  emptyMessage="No se encontraron tipos de vehiculos."
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
                  itemName="vehiculos"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
          data?.Items?.map((vehicle) => (
            <MobileCard
              key={vehicle.VehicleTypeId}
              title={vehicle.Name}
              subtitle={vehicle.VehicleTypeId.toString()}
              badge={<StatusBadge status={vehicle.status ? 'Activo' : 'Inactivo'} />}
              fields={[{ label: 'Cantidad', value: vehicle.Quantity }]}
              onEdit={() => handleEditTypeVehicle(vehicle)}
              onDelete={() => handleDeleteTypeVehicle(vehicle.VehicleTypeId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron tipos de vehiculos.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Agregar nuevo tipo de vehiculo"
        description="Crea un nuevo tipo de vehiculo completando el formulario a continuación."
        onSubmit={() => submitAddTypeVehicle()}
        submitText="Crear Vehiculo"
      >
        <FormField label="Nombre" required error={addForm.errors.Name}>
          <Input
            id="name"
            placeholder="Nombre"
            value={addForm.data.Name}
            onChange={(e) => addForm.setField('Name', e.target.value)}
          />
        </FormField>
        <FormField label="Capacidad" required error={addForm.errors.Quantity}>
          <Input
            id="quantity"
            placeholder="Capacidad"
            value={addForm.data.Quantity}
            onChange={(e) => addForm.setField('Quantity', Number(e.target.value))}
          />
        </FormField>
      </FormDialog>

      {/* Edit Customer Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar tipo de vehículo"
        description="Realiza cambios en los detalles del tipo de vehículo a continuación."
        onSubmit={() => submitEditTypeVehicle()}
        submitText="Guardar Cambios"
      >
        <FormField label="Nombre" required error={editForm.errors.Name}>
          <Input
            id="edit-name"
            value={editForm.data.Name}
            onChange={(e) => editForm.setField('Name', e.target.value)}
          />
        </FormField>
        <FormField label="Capacidad" required error={editForm.errors.Quantity}>
          <Input
            id="edit-capacidad"
            value={editForm.data.Quantity}
            onChange={(e) => editForm.setField('Quantity', Number(e.target.value))}
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
