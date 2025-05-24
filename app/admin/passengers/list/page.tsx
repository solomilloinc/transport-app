'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Building, Bus, Edit, Plus, Search, Trash, TruckIcon, UserPlusIcon } from 'lucide-react';
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
import { DeleteDialog } from '@/components/dashboard/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormReducer } from '@/hooks/use-form-reducer';
import { toast } from '@/hooks/use-toast';
import { PagedResponse } from '@/services/types';
import { Passenger } from '@/interfaces/passengers';
import { useFormValidation } from '@/hooks/use-form-validation';

const initialPassengersForm = {
  firstName: '',
  lastName: '',
  email: '',
  documentNumber: '',
  phone1: '',
  phone2: '',
};

const validationConfig = {
  firstName: {
    required: { message: 'El nombre es requerido' },
  },
  lastName: {
    required: { message: 'El apellido es requerido' },
  },
  email: {
    required: { message: 'El email es requerido' },
  },
  documentNumber: {
    required: { message: 'El número de documento es requerido' },
  },
  phone1: {
    required: { message: 'El teléfono 1 es requerido' },
  },
};

export default function PassengersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPassengersId, setCurrentPassengersId] = useState<number | null>(null);

  const addForm = useFormValidation(initialPassengersForm, validationConfig);

  // Form state for editing a vehicle
  const editForm = useFormValidation(initialPassengersForm, validationConfig);

  // State for the paged response
  const [passengersData, setPassengersData] = useState<PagedResponse<Passenger>>({
    Items: [],
    PageNumber: 1,
    PageSize: 8,
    TotalRecords: 0,
    TotalPages: 0,
  });
  // Function to fetch vehicles data
  const fetchPassengers = async (pageToFetch = currentPage, pageSizeToFetch = pageSize) => {
    setIsLoading(true);
    try {
      const response = await get<any, Passenger>('/customer-report', {
        pageNumber: pageToFetch,
        pageSize: pageSizeToFetch,
        sortBy: 'fecha',
        sortDescending: true,
        filters: searchQuery
          ? {
              search: searchQuery,
            }
          : {},
      });
      setPassengersData(response);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    fetchPassengers(currentPage, pageSize);
  }, [searchQuery, pageSize, currentPage]);

  const submitAddPassenger = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/customer-create', data);
        if (response) {
          toast({
            title: 'Pasajero creado',
            description: 'El pasajero ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetchPassengers(); // Refresh the vehicle list
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

  const submitEditPassenger = async () => {
    editForm.handleSubmit(async () => {
      try {
        const response = await put(`/customer-update/${currentPassengersId}`, editForm.data);
        if (response) {
          toast({
            title: 'Pasajero actualizado',
            description: 'El pasajero ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetchPassengers(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el pasajero',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar el pasajero',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddPassegers = () => {
    setCurrentPassengersId(null);
    addForm.resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditPassenger = (passenger: Passenger) => {
    setCurrentPassengersId(passenger.CustomerId);
    editForm.resetForm();
    const fields = {
      firstName: passenger.FirstName,
      lastName: passenger.LastName,
      email: passenger.Email,
      documentNumber: passenger.DocumentNumber,
      phone1: passenger.Phone1,
      phone2: passenger.Phone2,
    };

    Object.entries(fields).forEach(([key, value]) => {
      editForm.setField(key, value || '');
    });

    setIsEditModalOpen(true);
  };

  const handleDeletePassenger = (id: number) => {
    setCurrentPassengersId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/customer-delete/${currentPassengersId}`);
    setIsDeleteModalOpen(false);
    setCurrentPassengersId(null);
    fetchPassengers();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Nombre', accessor: 'FirstName', width: '20%' },
    { header: 'Apellido', accessor: 'LastName', width: '20%' },
    { header: 'Número de documento', accessor: 'DocumentNumber', width: '15%' },
    { header: 'Teléfono', accessor: 'Phone1', width: '15%' },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '15%',
      cell: (passenger: Passenger) => <StatusBadge status={passenger.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '15%',
      cell: (passenger: Passenger) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditPassenger(passenger)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeletePassenger(passenger.CustomerId)}
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
        title="Pasajeros"
        description="Gestiona y visualiza toda la información de las pasajeros."
        action={
          <Button onClick={() => handleAddPassegers()}>
            <UserPlusIcon className="mr-2 h-4 w-4" />
            Añadir pasajero
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
                data={passengersData.Items}
                emptyMessage="No se encontraron pasajeros."
                isLoading={isLoading}
                skeletonRows={passengersData.PageSize}
              />
            </div>

            {passengersData.Items.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={passengersData.TotalPages}
                totalItems={passengersData.TotalRecords}
                itemsPerPage={passengersData.PageSize}
                onPageChange={setCurrentPage}
                itemName="pasajeros"
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
        ) : passengersData.Items.length > 0 ? (
          passengersData.Items.map((passenger: Passenger) => (
            <MobileCard
              key={passenger.CustomerId}
              title={`${passenger.FirstName} ${passenger.LastName}`}
              badge={<StatusBadge status={passenger.Status ? 'Activo' : 'Inactivo'} />}
              fields={[
                { label: 'Documento', value: passenger.DocumentNumber },
                { label: 'Email', value: passenger.Email },
                { label: 'Telefono', value: passenger.Phone1 },
                { label: 'Telefono 2', value: passenger.Phone2 },
              ]}
              onEdit={() => handleEditPassenger(passenger)}
              onDelete={() => handleDeletePassenger(passenger.CustomerId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron pasajeros.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir pasajero"
        description="Crea un nuevo pasajero completando el formulario a continuación."
        onSubmit={() => submitAddPassenger()}
        submitText="Crear pasajero"
        isLoading={addForm.isSubmitting}
      >
        <FormField label="Nombre" required error={addForm.errors.firstName}>
          <Input
            id="first-name"
            value={addForm.data.firstName}
            type="text"
            placeholder="Nombre"
            onChange={(e) => addForm.setField('firstName', e.target.value)}
          />
        </FormField>
        <FormField label="Apellido" required error={addForm.errors.lastName}>
          <Input
            id="last-name"
            value={addForm.data.lastName}
            placeholder="Apellido"
            type="text"
            onChange={(e) => addForm.setField('lastName', e.target.value)}
          />
        </FormField>
        <FormField label="Email" required error={addForm.errors.email}>
          <Input id="email" value={addForm.data.email} onChange={(e) => addForm.setField('email', e.target.value)} />
        </FormField>
        <FormField label="Número de documento" required error={addForm.errors.documentNumber}>
          <Input
            id="documentNumber"
            value={addForm.data.documentNumber}
            placeholder="Número de documento"
            type="number"
            onChange={(e) => addForm.setField('documentNumber', e.target.value)}
          />
        </FormField>
        <FormField label="Teléfono 1" required error={addForm.errors.phone1}>
          <Input id="phone1" value={addForm.data.phone1} onChange={(e) => addForm.setField('phone1', e.target.value)} />
        </FormField>
        <FormField label="Teléfono 2">
          <Input id="phone2" value={addForm.data.phone2} onChange={(e) => addForm.setField('phone2', e.target.value)} />
        </FormField>
      </FormDialog>

      {/* Edit Customer Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar pasajero"
        description="Realiza cambios en los detalles del pasajero a continuación."
        onSubmit={() => submitEditPassenger()}
        submitText="Guardar Cambios"
        isLoading={editForm.isSubmitting}
      >
        <FormField label="Nombre" required error={editForm.errors.firstName}>
          <Input
            id="first-name"
            type="text"
            placeholder="Nombre"
            value={editForm.data.firstName}
            onChange={(e) => editForm.setField('firstName', e.target.value)}
          />
        </FormField>
        <FormField label="Apellido" required error={editForm.errors.lastName}>
          <Input
            id="last-name"
            value={editForm.data.lastName}
            type="text"
            placeholder="Apellido"
            onChange={(e) => editForm.setField('lastName', e.target.value)}
          />
        </FormField>
        <FormField label="Email" required error={editForm.errors.email}>
          <Input id="email" value={editForm.data.email} onChange={(e) => editForm.setField('email', e.target.value)} />
        </FormField>
        <FormField label="Número de documento" required error={editForm.errors.documentNumber}>
          <Input
            id="document-number"
            type="number"
            placeholder="Número de documento"
            value={editForm.data.documentNumber}
            onChange={(e) => editForm.setField('documentNumber', e.target.value)}
          />
        </FormField>
        <FormField label="Teléfono 1" required error={editForm.errors.phone1}>
          <Input
            id="phone1"
            type="text"
            placeholder="Teléfono 1"
            value={editForm.data.phone1}
            onChange={(e) => editForm.setField('phone1', e.target.value)}
          />
        </FormField>
        <FormField label="Teléfono 2">
          <Input
            id="phone2"
            value={editForm.data.phone2}
            onChange={(e) => editForm.setField('phone2', e.target.value)}
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
