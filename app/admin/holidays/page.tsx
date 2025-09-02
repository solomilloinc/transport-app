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
import { PagedResponse, PaginationParams } from '@/services/types';
import { Holiday } from '@/interfaces/holiday';
import { useFormValidation } from '@/hooks/use-form-validation';
import { usePaginationParams } from '@/utils/pagination';
import { useApi } from '@/hooks/use-api';
import { getHolidays } from '@/services/holiday';

const initialHolidaysForm = {
  holidayName: '',
  holidayDate: '',
};

const validationConfig = {
  holidayName: {
    required: { message: 'El nombre es requerido' },
  },
  holidayDate: {
    required: { message: 'La fecha es requerida' },
  },
};

export default function HolidaysManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentHolidaysId, setCurrentHolidaysId] = useState<number | null>(null);

  const addForm = useFormValidation(initialHolidaysForm, validationConfig);

  // Form state for editing a vehicle
  const editForm = useFormValidation(initialHolidaysForm, validationConfig);

  const params = usePaginationParams({
      pageNumber: currentPage,
      filters: { search: searchQuery },
  });
  
  const { data, loading, error, fetch } = useApi<Holiday, PaginationParams>(getHolidays, {
      autoFetch: true,
      params: params,
  });

  const submitAddHoliday = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/holiday-create', data);
        if (response) {
          toast({
            title: 'Feriado creado',
            description: 'El feriado ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetch({ pageNumber: currentPage }); // Refresh the list
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el feriado',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el feriado',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditHoliday = async () => {
    editForm.handleSubmit(async () => {
      try {
        const response = await put(`/holiday-update/${currentHolidaysId}`, editForm.data);
        if (response) {
          toast({
            title: 'Feriado actualizado',
            description: 'El feriado ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetch({ pageNumber: currentPage });
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el feriado',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar el feriado',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddHolidays = () => {
    setCurrentHolidaysId(null);
    addForm.resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setCurrentHolidaysId(holiday.HolidayId);
    editForm.resetForm();
    const fields = {
      holidayName: holiday.HolidayName,
      holidayDate: holiday.HolidayDate,
    };

    Object.entries(fields).forEach(([key, value]) => {
      editForm.setField(key, value || '');
    });

    setIsEditModalOpen(true);
  };

  const handleDeleteHoliday = (id: number) => {
    setCurrentHolidaysId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/holiday-delete/${currentHolidaysId}`);
    setIsDeleteModalOpen(false);
    setCurrentHolidaysId(null);
    fetch({ pageNumber: currentPage });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Nombre', accessor: 'HolidayName', width: '50%' },
    { header: 'Fecha', accessor: 'HolidayDate', width: '30%' },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '20%',
      cell: (holiday: Holiday) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditHoliday(holiday)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeleteHoliday(holiday.HolidayId)}
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
        title="Feriados"
        description="Gestiona y visualiza toda la información de los feriados."
        action={
          <Button onClick={() => handleAddHolidays()}>
            <UserPlusIcon className="mr-2 h-4 w-4" />
            Añadir feriado
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
                emptyMessage="No se encontraron feriados."
                isLoading={isLoading}
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
        ) : data.Items.length > 0 ? (
          data.Items.map((holiday: Holiday) => (
            <MobileCard
              key={holiday.HolidayId}
              title={`${holiday.HolidayName}`}
              fields={[
                { label: 'Fecha', value: holiday.HolidayDate },
              ]}
              onEdit={() => handleEditHoliday(holiday)}
              onDelete={() => handleDeleteHoliday(holiday.HolidayId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron feriados.</div>
        )}
      </div>

      {/* Add Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir feriado"
        description="Crea un nuevo feriado completando el formulario a continuación."
        onSubmit={() => submitAddHoliday()}
        submitText="Crear feriado"
        isLoading={addForm.isSubmitting}
      >
        <FormField label="Nombre" required error={addForm.errors.holidayName}>
          <Input
            id="holiday-name"
            value={addForm.data.holidayName}
            type="text"
            placeholder="Nombre"
            onChange={(e) => addForm.setField('holidayName', e.target.value)}
          />
        </FormField>
        <FormField label="Fecha" required error={addForm.errors.holidayDate}>
          <Input
            id="holiday-date"
            value={addForm.data.holidayDate}
            placeholder="Fecha"
            type="text"
            onChange={(e) => addForm.setField('holidayDate', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Edit Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar feriado"
        description="Realiza cambios en los detalles del feriado a continuación."
        onSubmit={() => submitEditHoliday()}
        submitText="Guardar Cambios"
        isLoading={editForm.isSubmitting}
      >
        <FormField label="Nombre" required error={editForm.errors.holidayName}>
          <Input
            id="holiday-name"
            type="text"
            placeholder="Nombre"
            value={editForm.data.holidayName}
            onChange={(e) => editForm.setField('holidayName', e.target.value)}
          />
        </FormField>
        <FormField label="Fecha" required error={editForm.errors.holidayDate}>
          <Input
            id="holiday-date"
            value={editForm.data.holidayDate}
            type="text"
            placeholder="Fecha"
            onChange={(e) => editForm.setField('holidayDate', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente el feriado y todos los datos asociados de nuestros servidores."
      />
    </div>
  );
}
