'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Bus, CreditCard, Edit, Plus, Search, Trash, TruckIcon, UserPlusIcon } from 'lucide-react';
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
import { ReservePrice } from '@/interfaces/reservePrice';
import { City } from '@/interfaces/city';
import { Service } from '@/interfaces/service';
import { useFormValidation } from '@/hooks/use-form-validation';
import { maxValueRule } from '@/utils/validation-rules';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const initialReservePriceForm = {
  originId: 0,
  destinationId: 0,
  price: '',
  reserveTypeId: '',
};

export default function PriceManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for current page to avoid double fetching
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPriceId, setCurrentPriceId] = useState<number | null>(null);

  const validationConfig = {
    originId: {
      required: { message: 'El origen es requerido' },
    },
    destinationId: {
      required: { message: 'El destino es requerido' },
    },
    price: {
      required: { message: 'El precio es requerido' },
      rules: [maxValueRule(1000000)],
    },
    reserveTypeId: {
      required: { message: 'El tipo de reserva es requerido' },
    },
  };
  const addForm = useFormValidation(initialReservePriceForm, validationConfig);
  // Form state for editing a vehicle
  const editForm = useFormValidation(initialReservePriceForm, validationConfig);
  const [cities, setCities] = useState<SelectOption[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // State for the paged response
  const [pricesData, setPricesData] = useState<PagedResponse<ReservePrice>>({
    Items: [],
    PageNumber: 1,
    PageSize: 8,
    TotalRecords: 0,
    TotalPages: 0,
  });
  // Function to fetch vehicles data
  const fetchPrices = async (pageToFetch = currentPage, pageSizeToFetch = pageSize) => {
    setIsLoading(true);
    try {
      const response = await get<any, PagedResponse<ReservePrice>>('/reserve-price-report', {
        pageNumber: pageToFetch,
        pageSize: pageSizeToFetch,
        sortBy: 'fecha',
        sortDescending: true,
        filters: searchQuery ? { search: searchQuery } : {},
      });
      setPricesData(response);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Fetch vehicles when search changes or on initial load
  useEffect(() => {
    fetchPrices(currentPage, pageSize);
  }, [searchQuery, pageSize, currentPage]);

  const loadAllOptions = async () => {
    try {
      setIsOptionsLoading(true);
      setOptionsError(null);
      const response = await get<any, PagedResponse<City>>('/city-report', {
        pageNumber: 1,
        pageSize: 100,
        sortBy: 'name',
        sortDescending: false,
      });
      if (response) {
        const formattedTypes = response.Items.map((city: City) => ({
          id: city.Id.toString(),
          value: city.Id.toString(),
          label: city.Name,
        }));
        setCities(formattedTypes);
      }
    } catch (error) {
      setOptionsError('Error al cargar las ciudades');
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const submitAddPrice = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post('/reserve-price-create', data);
        if (response) {
          toast({
            title: 'Precio creado',
            description: 'El precio ha sido creado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetchPrices(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el precio',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el precio',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditPrice = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const response = await put(`/reserve-price-update/${currentPriceId}`, data);
        if (response) {
          toast({
            title: 'Precio editado',
            description: 'El precio ha sido editado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetchPrices(); // Refresh the vehicle list
        } else {
          toast({
            title: 'Error',
            description: 'Error al editar el precio',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al editar el precio',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddPrice = () => {
    setCurrentPriceId(null);
    addForm.resetForm();
    setIsAddModalOpen(true);
    loadAllOptions();
  };

  const handleEditPrice = (price: ReservePrice) => {
    setCurrentPriceId(price.ReservePriceId);
    editForm.setField('originId', price.OriginId);
    editForm.setField('destinationId', price.DestinationId);
    editForm.setField('price', price.Price);
    editForm.setField('reserveTypeId', price.ReserveTypeId);
    setIsEditModalOpen(true);
    loadAllOptions();
  };

  const handleDeletePrice = (id: number) => {
    setCurrentPriceId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const id = await deleteLogic(`/reserve-price-delete/${currentPriceId}`);
    // In a real app, you would delete the vehicle from the database
    setIsDeleteModalOpen(false);
    setCurrentPriceId(null);
    fetchPrices();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Origen', accessor: 'OriginName', width: '25%' },
    { header: 'Destino', accessor: 'DestinationName', width: '25%' },
    {
      header: 'Tipo de Reserva',
      accessor: 'ReserveTypeId',
      width: '15%',
      cell: (price: ReservePrice) => (price.ReserveTypeId === 1 ? 'Solo Ida' : 'Ida y Vuelta'),
    },
    {
      header: 'Precio',
      accessor: 'Price',
      width: '15%',
      cell: (price: ReservePrice) => formatCurrency(price.Price),
    },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '10%',
      cell: (price: ReservePrice) => <StatusBadge status={price.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '10%',
      cell: (price: ReservePrice) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditPrice(price)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeletePrice(price.ReservePriceId)}
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
        title="Precios"
        description="Gestiona y visualiza toda la información de los precios base por tramo."
        action={
          <Button onClick={() => handleAddPrice()}>
            <CreditCard className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        }
      />

      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <FilterBar onReset={resetFilters}>
              <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por ciudad..." />
            </FilterBar>

            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={pricesData.Items}
                emptyMessage="No se encontraron precios."
                isLoading={isLoading}
                skeletonRows={pricesData.PageSize}
              />
            </div>

            {pricesData.Items.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={pricesData.TotalPages}
                totalItems={pricesData.TotalRecords}
                itemsPerPage={pricesData.PageSize}
                onPageChange={setCurrentPage}
                itemName="precios"
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
        ) : pricesData.Items.length > 0 ? (
          pricesData.Items.map((price) => (
            <MobileCard
              key={price.ReservePriceId}
              title={`${price.OriginName} → ${price.DestinationName}`}
              subtitle={formatCurrency(price.Price)}
              badge={<StatusBadge status={price.Status} />}
              fields={[{ label: 'Tipo de Reserva', value: price.ReserveTypeId === 1 ? 'Solo Ida' : 'Ida y Vuelta' }]}
              onEdit={() => handleEditPrice(price)}
              onDelete={() => handleDeletePrice(price.ReservePriceId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron precios.</div>
        )}
      </div>

      {/* Add Price Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Agregar Nuevo Precio"
        description="Crea un nuevo precio base entre dos ciudades."
        onSubmit={() => submitAddPrice()}
        submitText="Crear Precio"
      >
        <div className="space-y-4">
          <FormField label="Origen" required error={addForm.errors.originId}>
            <ApiSelect
              value={String(addForm.data.originId)}
              onValueChange={(value) => addForm.setField('originId', Number(value))}
              placeholder="Seleccionar origen"
              options={cities}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
          <FormField label="Destino" required error={addForm.errors.destinationId}>
            <ApiSelect
              value={String(addForm.data.destinationId)}
              onValueChange={(value) => addForm.setField('destinationId', Number(value))}
              placeholder="Seleccionar destino"
              options={cities.filter(c => c.id !== String(addForm.data.originId))}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
          <FormField label="Tipo de Reserva" required error={addForm.errors.reserveTypeId}>
            <ApiSelect
              value={String(addForm.data.reserveTypeId)}
              onValueChange={(value) => addForm.setField('reserveTypeId', Number(value))}
              placeholder="Seleccionar tipo de reserva"
              options={[
                { id: '1', value: '1', label: 'Solo Ida' },
                { id: '2', value: '2', label: 'Ida y vuelta' },
              ]}
            />
          </FormField>
          <FormField label="Precio Base ($)" required error={addForm.errors.price}>
            <Input
              type="number"
              value={addForm.data.price || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number.parseFloat(e.target.value);
                addForm.setField('price', value);
              }}
              min="0.01"
              step="100"
              placeholder="Ingrese el precio"
              className="w-full"
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Edit Price Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Precio"
        description="Realiza cambios en los detalles del precio a continuación."
        onSubmit={() => submitEditPrice()}
        submitText="Guardar Cambios"
      >
        <div className="space-y-4">
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
              options={cities.filter(c => c.id !== String(editForm.data.originId))}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
          <FormField label="Tipo de Reserva" required error={editForm.errors.reserveTypeId}>
            <Select
              value={String(editForm.data.reserveTypeId)}
              onValueChange={(value) => editForm.setField('reserveTypeId', Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo de reserva" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Solo Ida</SelectItem>
                <SelectItem value="2">Ida y vuelta</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Precio ($)" required error={editForm.errors.price}>
            <Input
              type="number"
              value={editForm.data.price || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number.parseFloat(e.target.value);
                editForm.setField('price', value);
              }}
              min="0.01"
              step="100"
              placeholder="Ingrese el precio"
              className="w-full"
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente el precio de nuestros servidores."
      />
    </div>
  );
}
