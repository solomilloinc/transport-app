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
import { Direction } from '@/interfaces/direction';
import { City } from '@/interfaces/city';
import { useFormValidation } from '@/hooks/use-form-validation';

const initialDirectionForm = {
  cityId: 0,
  directionName: '',
};

const validationConfig = {
  cityId: {
    required: { message: 'La ciudad es requerida' },
  },
  directionName: {
    required: { message: 'La direccion es requerida' },
  },
};

export default function DirectionManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDirectionId, setCurrentDirectionId] = useState<number | null>(null);

  const addForm = useFormValidation(initialDirectionForm, validationConfig);

  // Form state for editing a direction
  const editForm = useFormValidation(initialDirectionForm, validationConfig);
  const [cities, setCities] = useState<SelectOption[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // State for the paged response
  const [directionsData, setDirectionsData] = useState<PagedResponse<Direction>>({
    Items: [],
    PageNumber: 1,
    PageSize: 8,
    TotalRecords: 0,
    TotalPages: 0,
  });
  // Function to fetch directions data
  const fetchDirections = async (pageToFetch = currentPage, pageSizeToFetch = pageSize) => {
    setIsLoading(true);
    try {
      const response = await get<any, Direction>('/direction-report', {
        pageNumber: pageToFetch,
        pageSize: pageSizeToFetch,
        sortBy: 'nombre',
        sortDescending: true,
        filters: searchQuery ? { search: searchQuery } : {},
      });
      setDirectionsData(response);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Fetch directions when search changes or on initial load
  useEffect(() => {
    fetchDirections(currentPage, pageSize);
  }, [searchQuery, pageSize, currentPage]);

  const loadAllOptions = async () => {
    try {
      setIsOptionsLoading(true);
      setOptionsError(null);
      const response = await get<any, City>('/city-report', {
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'nombre',
        sortDescending: true,
        filters: searchQuery ? { search: searchQuery } : {},
      });
      if (response) {
        const formattedTypes = response.Items.map((type: City) => ({
          id: type.Id.toString(),
          value: type.Id.toString(),
          label: type.Name,
        }));
        setCities(formattedTypes);
      }
    } catch (error) {
      setOptionsError('Error al cargar las ciudades');
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const submitAddDirection = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/direction-create', data);
        if (response) {
          toast({
            title: 'Direccion creada',
            description: 'La dirección ha sido creada exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetchDirections(); // Refresh the directions list
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear la dirección',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear la dirección',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditDirection = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const response = await put(`/direction-update/${currentDirectionId}`, data);
        if (response) {
          toast({
            title: 'Direccion actualizada',
            description: 'La dirección ha sido actualizada exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetchDirections(); // Refresh the directions list
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar la dirección',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar la dirección',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddDirection = () => {
    setCurrentDirectionId(null);
    addForm.resetForm();
    setIsAddModalOpen(true);
    loadAllOptions();
  };

  const handleSetCity = (value: string, quantity?: string) => {
    addForm.setField('Id', Number(value));
  };

  const handleEditDirection = (direction: Direction) => {
    setCurrentDirectionId(direction.DirectionId);
    editForm.setField('CityId', direction.CityId);
    editForm.setField('DirectionName', direction.DirectionName);
    setIsEditModalOpen(true);
    loadAllOptions();
  };

  const handleDeleteDirection = (id: number) => {
    setCurrentDirectionId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/direction-delete/${currentDirectionId}`);
    // In a real app, you would delete the vehicle from the database
    setIsDeleteModalOpen(false);
    setCurrentDirectionId(null);
    fetchDirections();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Ciudad', accessor: 'Name', width: '30%' },
    { header: 'Direccion', accessor: 'DirectionName', width: '50%' },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '20%',
      cell: (direction: Direction) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditDirection(direction)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeleteDirection(direction.DirectionId)}
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
        title="Direcciones"
        description="Gestiona y visualiza toda la información de las direcciones"
        action={
          <Button onClick={() => handleAddDirection()}>
            <TruckIcon className="mr-2 h-4 w-4" />
            Añadir Direccion
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
                data={directionsData.Items}
                emptyMessage="No se encontraron direcciones."
                isLoading={isLoading}
                skeletonRows={directionsData.PageSize}
              />
            </div>

            {directionsData.Items.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={directionsData.TotalPages}
                totalItems={directionsData.TotalRecords}
                itemsPerPage={directionsData.PageSize}
                onPageChange={setCurrentPage}
                itemName="direcciones"
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
        ) : directionsData.Items.length > 0 ? (
          directionsData.Items.map((direction) => (
            <MobileCard
              key={direction.DirectionId}
              title={direction.DirectionName}
              subtitle={direction.DirectionId.toString()}
              fields={[
                { label: 'Nombre', value: direction.DirectionName },
              ]}
              onEdit={() => handleEditDirection(direction)}
              onDelete={() => handleDeleteDirection(direction.DirectionId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron direcciones.</div>
        )}
      </div>

      {/* Add Direction Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir direccion"
        description="Crea una direccion completando el formulario a continuación."
        onSubmit={() => submitAddDirection()}
        submitText="Crear direccion"
        isLoading={addForm.isSubmitting}
      >
        <FormField label="Ciudad" required error={addForm.errors.cityId}>
          <ApiSelect
            value={String(addForm.data.cityId)}
            onValueChange={(value) =>
              handleSetCity(value, cities.find((city) => city.id === value)?.defaultQuantity)
            }
            placeholder="Seleccionar ciudad"
            options={cities}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando ciudades..."
            errorMessage="Error al cargar las ciudades"
            emptyMessage="No hay ciudades disponibles"
          />
        </FormField>
        <FormField label="Nombre" required error={addForm.errors.DirectionName}>
          <Input
            id="directionName"
            placeholder="Nombre de la dirección"
            value={addForm.data.directionName}
            onChange={(e) => addForm.setField('directionName', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Edit Direction Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar direccion"
        description="Realiza cambios en los detalles de la dirección a continuación."
        onSubmit={() => submitEditDirection()}
        submitText="Guardar Cambios"
        isLoading={editForm.isSubmitting}
      >
        <FormField label="Ciudad" required error={editForm.errors.cityId}>
          <ApiSelect
            value={String(editForm.data.cityId)}
            onValueChange={(value) => {
              handleSetCity(value, cities.find((city) => city.id === value)?.defaultQuantity);
            }}
            placeholder="Seleccionar ciudad"
            options={cities}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando ciudades..."
            errorMessage="Error al cargar las ciudades"
            emptyMessage="No hay ciudades disponibles"
          />
        </FormField>
        <FormField label="Nombre" required error={editForm.errors.directionName}>
          <Input
            id="edit-directionName"
            value={editForm.data.directionName}
            onChange={(e) => editForm.setField('directionName', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente la direccion y todos los datos asociados de nuestros servidores."
      />
    </div>
  );
}
