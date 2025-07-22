'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Building, Bus, Edit, Plus, Search, Trash, TruckIcon, User, UserPlusIcon } from 'lucide-react';
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
import { PagedResponse, PaginationParams } from '@/services/types';
import { City } from '@/interfaces/city';
import { Driver, emptyDriver } from '@/interfaces/driver';
import { useFormValidation } from '@/hooks/use-form-validation';
import { validationConfigDriver } from '@/validations/driverSchema';
import { useApi } from '@/hooks/use-api';
import { getDrivers } from '@/services/driver';
import { usePaginationParams } from '@/utils/pagination';

export default function DriversManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);
  const addForm = useFormValidation(emptyDriver, validationConfigDriver);

  // Form state for editing a vehicle
  const editForm = useFormValidation(emptyDriver, validationConfigDriver);

  const params = usePaginationParams({
    pageNumber: currentPage,
    filters: { search: searchQuery },
  });

  const { data, loading, error, fetch } = useApi<Driver, PaginationParams>(getDrivers, {
    autoFetch: true,
    params: params,
  });

  const submitAddDriver = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/driver-create', data);
        if (response) {
          toast({
            title: 'Chofer creado',
            description: 'El chofer ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetch({ pageNumber: currentPage });
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el chofer',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el chofer',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditDriver = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const response = await put(`/driver-update/${currentDriverId}`, data);
        if (response) {
          toast({
            title: 'Chofer actualizado',
            description: 'El chofer ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetch({ pageNumber: currentPage }); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el chofer',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar el chofer',
          variant: 'destructive',
        });
      }
    });
  };

  const handleEditDriver = (driver: Driver) => {
    setCurrentDriverId(driver.DriverId);
    editForm.setField('firstName', driver.FirstName);
    editForm.setField('lastName', driver.LastName);
    editForm.setField('documentNumber', driver.DocumentNumber);
    setIsEditModalOpen(true);
  };

  const handleDeleteDriver = (id: number) => {
    setCurrentDriverId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/vehicle-delete/${currentDriverId}`);
    // In a real app, you would delete the vehicle from the database
    setIsDeleteModalOpen(false);
    setCurrentDriverId(null);
    fetch(params);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Nombre', accessor: 'FirstName', width: '20%' },
    { header: 'Apellido', accessor: 'LastName', width: '20%' },
    { header: 'Numero de documento', accessor: 'DocumentNumber', width: '20%' },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '20%',
      cell: (driver: Driver) => <StatusBadge status={driver.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '20%',
      cell: (driver: Driver) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleEditDriver(driver)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeleteDriver(driver.DriverId)}
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
        title="Choferes"
        description="Gestiona y visualiza toda la información de las choferes."
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Añadir chofer
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
                data={data.Items}
                emptyMessage="No se encontraron choferes."
                isLoading={loading}
                skeletonRows={data.PageSize}
              />
            </div>

            {data.Items.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={data.TotalPages}
                totalItems={data.TotalRecords}
                itemsPerPage={data.PageSize}
                onPageChange={setCurrentPage}
                itemName="choferes"
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
        ) : data.Items.length > 0 ? (
          data.Items.map((driver) => (
            <MobileCard
              key={driver.DriverId}
              title={driver.FirstName}
              subtitle={driver.LastName}
              badge={<StatusBadge status={driver.Status ? 'Activo' : 'Inactivo'} />}
              fields={[
                { label: 'Nombre', value: driver.FirstName },
                { label: 'Apellido', value: driver.LastName },
                { label: 'Numero de documento', value: driver.DocumentNumber },
              ]}
              onEdit={() => handleEditDriver(driver)}
              onDelete={() => handleDeleteDriver(driver.DriverId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron choferes.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir chofer"
        description="Crea un nuevo chofer completando el formulario a continuación."
        onSubmit={() => submitAddDriver()}
        submitText="Crear Chofer"
      >
        <FormField label="Nombre" required error={addForm.errors.firstName}>
          <Input id="firstName" placeholder="Nombre" value={addForm.data.firstName} onChange={(e) => addForm.setField('firstName', e.target.value)} />
        </FormField>
        <FormField label="Apellido" required error={addForm.errors.lastName}>
          <Input id="lastName" placeholder="Apellido" value={addForm.data.lastName} onChange={(e) => addForm.setField('lastName', e.target.value)} />
        </FormField>
        <FormField label="Numero de documento" required error={addForm.errors.documentNumber}>
          <Input
            id="documentNumber"
            placeholder="Numero de documento"
            value={addForm.data.documentNumber}
            onChange={(e) => addForm.setField('documentNumber', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Edit Customer Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar chofer"
        description="Realiza cambios en los detalles del chofer a continuación."
        onSubmit={() => submitEditDriver()}
        submitText="Guardar Cambios"
      >
        <FormField label="Nombre" required error={editForm.errors.firstName}>
          <Input id="edit-name" value={editForm.data.firstName} onChange={(e) => editForm.setField('firstName', e.target.value)} />
        </FormField>
        <FormField label="Apellido" required error={editForm.errors.lastName}>
          <Input id="edit-lastName" value={editForm.data.lastName} onChange={(e) => editForm.setField('lastName', e.target.value)} />
        </FormField>
        <FormField label="Numero de documento" required error={editForm.errors.documentNumber}>
          <Input
            id="edit-documentNumber"
            value={editForm.data.documentNumber}
            onChange={(e) => editForm.setField('documentNumber', e.target.value)}
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
