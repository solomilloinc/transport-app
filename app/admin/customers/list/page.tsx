'use client';

import type React from 'react';

import { useState } from 'react';
import { Building, Bus, Edit, Plus, Search, Trash, TruckIcon, UserPlusIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteLogic, post, put } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { FilterBar } from '@/components/dashboard/filter-bar';
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
import { PagedResponse, PaginationParams } from '@/services/types';
import { emptyPassenger, Passenger } from '@/interfaces/passengers';
import { useFormValidation } from '@/hooks/use-form-validation';
import { getCustomerReport } from '@/services/passenger';
import { useReportFilters } from '@/hooks/use-report-filters';
import {
  CustomerReportFilters,
  emptyCustomerReportFilters,
} from '@/interfaces/filters/customer-filters';
import {
  ENTITY_STATUS_OPTIONS,
  EntityStatus,
} from '@/interfaces/filters/common';
import {
  dateParser,
  enumParser,
  piiStringParser,
} from '@/hooks/url-parsers';

const customerFilterParsers = {
  search: piiStringParser,
  email: piiStringParser,
  createdFrom: dateParser,
  createdTo: dateParser,
  status: enumParser<EntityStatus>([
    EntityStatus.Active,
    EntityStatus.Inactive,
    EntityStatus.Deleted,
    EntityStatus.Suspended,
  ]),
};
import { validationConfigPassenger } from '@/validations/passengerSchema';
import { getApiErrorMessage, bindApiErrorToForm } from '@/lib/apiErrors';

export default function PassengersManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPassengersId, setCurrentPassengersId] = useState<number | null>(null);

  const addForm = useFormValidation(emptyPassenger, validationConfigPassenger);
  const editForm = useFormValidation(emptyPassenger, validationConfigPassenger);

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
  } = useReportFilters<CustomerReportFilters, Passenger>({
    defaults: emptyCustomerReportFilters,
    parsers: customerFilterParsers,
    apiCall: getCustomerReport,
    initialPageSize: 8,
  });

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
          refetch(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el pasajero',
            variant: 'destructive',
          });
        }
      } catch (error) {
        bindApiErrorToForm(error, addForm.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(error).message,
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
          refetch(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el pasajero',
            variant: 'destructive',
          });
        }
      } catch (error) {
        bindApiErrorToForm(error, editForm.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(error).message,
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
    setCurrentPassengersId(passenger.customerId);
    editForm.resetForm();
    const fields = {
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      email: passenger.email,
      documentNumber: passenger.documentNumber,
      phone1: passenger.phone1,
      phone2: passenger.phone2,
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
    try {
      await deleteLogic(`/customer-delete/${currentPassengersId}`);
      setIsDeleteModalOpen(false);
      setCurrentPassengersId(null);
      refetch();
    } catch (error) {
      // Surface backend errors (e.g. Customer.HasActiveSubscriptions) via toast.
      // Mantengo el modal abierto para que el admin pueda confirmar leer y cerrar.
      toast({
        title: 'No se pudo eliminar',
        description: getApiErrorMessage(error).message,
        variant: 'destructive',
      });
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'firstName', width: '15%' },
    { header: 'Apellido', accessor: 'lastName', width: '15%' },
    { header: 'Documento', accessor: 'documentNumber', width: '12%' },
    { header: 'Teléfono', accessor: 'phone1', width: '12%' },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '10%',
      cell: (passenger: Passenger) => <StatusBadge status={passenger.status} />,
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
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeletePassenger(passenger.customerId)}
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
            Agregar
          </Button>
        }
      />

      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <FilterBar onReset={reset} onApply={apply}>
              <Input
                className="w-full sm:w-[220px]"
                placeholder="Nombre o documento"
                value={draft.search ?? ''}
                onChange={(e) => setDraftField('search', e.target.value)}
              />
              <Input
                className="w-full sm:w-[180px]"
                placeholder="Email"
                value={draft.email ?? ''}
                onChange={(e) => setDraftField('email', e.target.value)}
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
                emptyMessage="No se encontraron pasajeros."
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
                itemName="pasajeros"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile view - Card layout */}
      <div className="md:hidden space-y-4 mt-4">
        {loading && data?.items?.length === 0 ? (
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
          data?.items?.map((passenger: Passenger) => (
            <MobileCard
              key={passenger.customerId}
              title={`${passenger.firstName} ${passenger.lastName}`}
              badge={<StatusBadge status={passenger.status ? 'Activo' : 'Inactivo'} />}
              fields={[
                { label: 'Documento', value: passenger.documentNumber },
                { label: 'Email', value: passenger.email },
                { label: 'Telefono', value: passenger.phone1 },
                { label: 'Telefono 2', value: passenger.phone2 },
              ]}
              onEdit={() => handleEditPassenger(passenger)}
              onDelete={() => handleDeletePassenger(passenger.customerId)}
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
        title="Agregar pasajero"
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
        <FormField label="Email" error={addForm.errors.email}>
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
        <FormField label="Teléfono 1" error={addForm.errors.phone1}>
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
        <FormField label="Email" error={editForm.errors.email}>
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
        <FormField label="Teléfono 1" error={editForm.errors.phone1}>
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
