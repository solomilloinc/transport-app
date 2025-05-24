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
import { Service } from '@/interfaces/service';
import { useFormValidation } from '@/hooks/use-form-validation';
import { maxValueRule } from '@/utils/validation-rules';

const initialReservePriceForm = {
  serviceId: '',
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
    serviceId: {
      required: { message: 'El servicio es requerido' },
    },
    price: {
      required: { message: 'El precio es requerido' },
      rules: [maxValueRule(1000)],
    },
    reserveTypeId: {
      required: { message: 'El tipo de reserva es requerido' },
    },
  };
  const addForm = useFormValidation(initialReservePriceForm, validationConfig);
  // Form state for editing a vehicle
  const editForm = useFormValidation(initialReservePriceForm, validationConfig);
  const [services, setServices] = useState<SelectOption[]>([]);
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
      const response = await get<any, ReservePrice>('/reserve-price-report', {
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
      const response = await get<any, Service>('/service-report', {
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'fecha',
        sortDescending: true,
        filters: searchQuery ? { search: searchQuery } : {},
      });
      if (response) {
        const formattedTypes = response.Items.map((service: Service) => ({
          id: service.ServiceId.toString(),
          value: service.ServiceId.toString(),
          label: service.Name,
        }));
        setServices(formattedTypes);
      }
    } catch (error) {
      setOptionsError('Error al cargar los servicios');
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const submitAddPrice = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const response = await post(`service/${data.serviceId}/price-add`, data);
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
        const response = await put(`service/${data.serviceId}/price-update`, data);
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
    editForm.setField('serviceId', price.ServiceId);
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
    { header: 'Sevicio', accessor: 'ServiceName', width: '30%' },
    { header: 'ReserveType', accessor: 'ReserveType', width: '15%' },
    {
      header: 'Precio',
      accessor: 'price',
      cell: (price: ReservePrice) => <>${price.Price} </>,
      hidden: true,
      width: '15%',
    },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '20%',
      cell: (price: ReservePrice) => <StatusBadge status={price.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '20%',
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
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
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
        description="Gestiona y visualiza toda la información de los precios de los servicios."
        action={
          <Button onClick={() => handleAddPrice()}>
            <CreditCard className="mr-2 h-4 w-4" />
            Añadir Precio
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
              title={price.ServiceName}
              subtitle={price.Price.toString()}
              badge={<StatusBadge status={price.Status ? 'Activo' : 'Inactivo'} />}
              fields={[{ label: 'Tipo de Reserva', value: price.ReserveTypeId }]}
              onEdit={() => handleEditPrice(price)}
              onDelete={() => handleDeletePrice(price.ReservePriceId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron precios.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Añadir Nuevo Precio"
        description="Crea un nuevo precio completando el formulario a continuación."
        onSubmit={() => submitAddPrice()}
        submitText="Crear Precio"
      >
        <FormField label="Servicio" required error={addForm.errors.serviceId}>
          <ApiSelect
            value={String(addForm.data.serviceId)}
            onValueChange={(value) => addForm.setField('serviceId', Number(value))}
            placeholder="Seleccionar servicio"
            options={services}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando servicios..."
            errorMessage="Error al cargar los servicios"
            emptyMessage="No hay servicios disponibles"
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
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando tipos de reserva..."
            errorMessage="Error al cargar los tipos de reserva"
            emptyMessage="No hay tipos de reserva disponibles"
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
            step="0.01"
            placeholder="Ingrese el precio"
            className="w-full"
          />
        </FormField>
      </FormDialog>

      {/* Edit Customer Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Precio"
        description="Realiza cambios en los detalles del precio a continuación."
        onSubmit={() => submitEditPrice()}
        submitText="Guardar Cambios"
      >
        <FormField label="Servicio" required error={editForm.errors.name}>
          <ApiSelect
            value={String(editForm.data.serviceId)}
            onValueChange={(value) => editForm.setField('serviceId', Number(value))}
            placeholder="Seleccionar servicio"
            options={services}
            loading={isOptionsLoading}
            error={optionsError}
            loadingMessage="Cargando servicios..."
            errorMessage="Error al cargar los servicios"
            emptyMessage="No hay servicios disponibles"
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
        <FormField label="Precio" required error={editForm.errors.price}>
          <Input
            id="price"
            placeholder="Precio"
            value={editForm.data.price}
            onChange={(e) => editForm.setField('price', Number(e.target.value))}
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
