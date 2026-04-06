'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Trash, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteLogic, get, post, put } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { DeleteDialog } from '@/components/dashboard/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { PagedResponse } from '@/services/types';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { City } from '@/interfaces/city';
import { Direction } from '@/interfaces/direction';
import { useFormValidation } from '@/hooks/use-form-validation';
import { Trip, TripPrice, emptyTripPriceForm } from '@/interfaces/trip';
import { getTripById } from '@/services/trip';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const tripPriceValidationSchema = {
  cityId: {
    required: { message: 'La ciudad es requerida' },
  },
  reserveTypeId: {
    required: { message: 'El tipo de reserva es requerido' },
  },
  price: {
    required: { message: 'El precio es requerido' },
  },
  order: {
    required: { message: 'El orden es requerido' },
  },
};

export default function TripPricesManagement() {
  const params = useParams();
  const router = useRouter();
  const tripId = Number(params.id);

  const [filterReserveType, setFilterReserveType] = useState<string>('');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para cargar el trip
  const fetchTrip = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await getTripById(id);
      setTrip(response);
    } catch {
      toast({
        title: 'Error',
        description: 'Error al cargar la ruta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
    }
  }, [tripId]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPriceId, setCurrentPriceId] = useState<number | null>(null);

  const addForm = useFormValidation({ ...emptyTripPriceForm, tripId }, tripPriceValidationSchema);
  const editForm = useFormValidation(emptyTripPriceForm, tripPriceValidationSchema);

  const [cities, setCities] = useState<SelectOption[]>([]);
  const [directions, setDirections] = useState<SelectOption[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const loadOptions = async () => {
    try {
      setIsOptionsLoading(true);
      setOptionsError(null);

      const [cityResponse, directionResponse] = await Promise.all([
        get<any, PagedResponse<City>>('/city-report', {
          pageNumber: 1,
          pageSize: 100,
          sortBy: 'name',
          sortDescending: false,
        }),
        get<any, PagedResponse<Direction>>('/direction-report', {
          pageNumber: 1,
          pageSize: 100,
          sortBy: 'fecha',
          sortDescending: true,
          filters: {},
        }),
      ]);

      if (cityResponse) {
        const formattedCities = cityResponse.Items.map((city: City) => ({
          id: city.Id.toString(),
          value: city.Id.toString(),
          label: city.Name,
        }));
        setCities(formattedCities);
      }

      if (directionResponse) {
        const formattedDirections = directionResponse.Items.map((direction: Direction) => ({
          id: direction.DirectionId.toString(),
          value: direction.DirectionId.toString(),
          label: direction.Name,
        }));
        setDirections([{ id: 'none', value: 'none', label: 'Ninguna' }, ...formattedDirections]);
      }
    } catch (error) {
      setOptionsError('Error al cargar las opciones');
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const submitAddPrice = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          TripId: tripId,
          CityId: data.cityId,
          DirectionId: data.directionId || null,
          ReserveTypeId: data.reserveTypeId,
          Price: data.price,
          Order: data.order,
        };
        const response = await post('/trip-price-add', transformedData);
        if (response) {
          toast({
            title: 'Precio agregado',
            description: 'El precio ha sido agregado exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetchTrip(tripId);
        } else {
          toast({
            title: 'Error',
            description: 'Error al agregar el precio',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al agregar el precio',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditPrice = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          CityId: data.cityId,
          DirectionId: data.directionId || null,
          ReserveTypeId: data.reserveTypeId,
          Price: data.price,
          Order: data.order,
        };
        const response = await put(`/trip-price-update/${currentPriceId}`, transformedData);
        if (response) {
          toast({
            title: 'Precio actualizado',
            description: 'El precio ha sido actualizado exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetchTrip(tripId);
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar el precio',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar el precio',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddPrice = () => {
    setCurrentPriceId(null);
    addForm.resetForm();
    addForm.setField('tripId', tripId);
    setIsAddModalOpen(true);
    loadOptions();
  };

  const handleEditPrice = (price: TripPrice) => {
    setCurrentPriceId(price.TripPriceId);
    editForm.setField('cityId', price.CityId);
    editForm.setField('directionId', price.DirectionId);
    editForm.setField('reserveTypeId', price.ReserveTypeId);
    editForm.setField('price', price.Price);
    editForm.setField('order', price.Order);
    setIsEditModalOpen(true);
    loadOptions();
  };

  const handleDeletePrice = (id: number) => {
    setCurrentPriceId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    await deleteLogic(`/trip-price-delete/${currentPriceId}`);
    setIsDeleteModalOpen(false);
    setCurrentPriceId(null);
    fetchTrip(tripId);
  };

  const filteredPrices = trip?.Prices?.filter((price) => {
    if (!filterReserveType) return true;
    return price.ReserveTypeId === Number(filterReserveType);
  }) || [];

  const columns = [
    { header: 'Ciudad', accessor: 'CityName', width: '20%' },
    {
      header: 'Dirección',
      accessor: 'DirectionName',
      width: '20%',
      cell: (price: TripPrice) => price.DirectionName || '-',
    },
    {
      header: 'Tipo',
      accessor: 'ReserveTypeId',
      width: '15%',
      cell: (price: TripPrice) => (price.ReserveTypeId === 1 ? 'Ida' : 'Ida y Vuelta'),
    },
    {
      header: 'Precio',
      accessor: 'Price',
      width: '15%',
      cell: (price: TripPrice) => formatCurrency(price.Price),
    },
    { header: 'Orden', accessor: 'Order', width: '10%' },
    {
      header: 'Estado',
      accessor: 'Status',
      className: 'text-center',
      width: '10%',
      cell: (price: TripPrice) => <StatusBadge status={price.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '10%',
      cell: (price: TripPrice) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-full border-black/8 bg-white/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            onClick={() => handleEditPrice(price)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeletePrice(price.TripPriceId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/trips')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <PageHeader
        title={`Precios: ${trip?.Description || ''}`}
        description={`${trip?.OriginCityName} → ${trip?.DestinationCityName}`}
        action={
          <Button onClick={handleAddPrice} className="rounded-full bg-blue-600 px-5 text-white shadow-sm hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Precio
          </Button>
        }
      />

      <div className="space-y-4 w-full">
            <FilterBar onReset={() => setFilterReserveType('')}>
              <ApiSelect
                value={filterReserveType}
                onValueChange={setFilterReserveType}
                placeholder="Filtrar por tipo"
                options={[
                  { id: '1', value: '1', label: 'Ida' },
                  { id: '2', value: '2', label: 'Ida y Vuelta' },
                ]}
              />
            </FilterBar>

            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={filteredPrices}
                emptyMessage="No hay precios configurados."
                isLoading={isLoading}
                skeletonRows={5}
              />
            </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4 mt-4">
        {filteredPrices.length > 0 ? (
          filteredPrices.map((price) => (
            <MobileCard
              key={price.TripPriceId}
              title={price.CityName}
              subtitle={formatCurrency(price.Price)}
              badge={<StatusBadge status={price.Status} />}
              fields={[
                { label: 'Tipo', value: price.ReserveTypeId === 1 ? 'Ida' : 'Ida y Vuelta' },
                { label: 'Orden', value: String(price.Order) },
                { label: 'Dirección', value: price.DirectionName || '-' },
              ]}
              onEdit={() => handleEditPrice(price)}
              onDelete={() => handleDeletePrice(price.TripPriceId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No hay precios configurados.</div>
        )}
      </div>

      {/* Add Price Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Agregar Precio"
        description="Configura un nuevo precio para esta ruta."
        onSubmit={submitAddPrice}
        submitText="Agregar Precio"
      >
        <div className="space-y-4">
          <FormField label="Ciudad" required error={addForm.errors.cityId}>
            <ApiSelect
              value={String(addForm.data.cityId)}
              onValueChange={(value) => addForm.setField('cityId', Number(value))}
              placeholder="Seleccionar ciudad"
              options={cities}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
          <FormField label="Dirección (Opcional)" error={addForm.errors.directionId}>
            <ApiSelect
              value={addForm.data.directionId ? String(addForm.data.directionId) : 'none'}
              onValueChange={(value) => addForm.setField('directionId', value === 'none' ? null : Number(value))}
              placeholder="Seleccionar dirección"
              options={directions}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando direcciones..."
              errorMessage="Error al cargar las direcciones"
              emptyMessage="No hay direcciones disponibles"
            />
          </FormField>
          <FormField label="Tipo de Reserva" required error={addForm.errors.reserveTypeId}>
            <ApiSelect
              value={String(addForm.data.reserveTypeId)}
              onValueChange={(value) => addForm.setField('reserveTypeId', Number(value))}
              placeholder="Seleccionar tipo"
              options={[
                { id: '1', value: '1', label: 'Ida' },
                { id: '2', value: '2', label: 'Ida y Vuelta' },
              ]}
            />
          </FormField>
          <FormField label="Precio ($)" required error={addForm.errors.price}>
            <Input
              type="number"
              value={addForm.data.price || ''}
              onChange={(e) => addForm.setField('price', e.target.value ? Number(e.target.value) : 0)}
              min="0"
              step="100"
              placeholder="Ingrese el precio"
            />
          </FormField>
          <FormField label="Orden" required error={addForm.errors.order}>
            <Input
              type="number"
              value={addForm.data.order || ''}
              onChange={(e) => addForm.setField('order', e.target.value ? Number(e.target.value) : 1)}
              min="1"
              placeholder="Orden de la parada"
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Edit Price Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Precio"
        description="Modifica los detalles del precio."
        onSubmit={submitEditPrice}
        submitText="Guardar Cambios"
      >
        <div className="space-y-4">
          <FormField label="Ciudad" required error={editForm.errors.cityId}>
            <ApiSelect
              value={String(editForm.data.cityId)}
              onValueChange={(value) => editForm.setField('cityId', Number(value))}
              placeholder="Seleccionar ciudad"
              options={cities}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
          <FormField label="Dirección (Opcional)" error={editForm.errors.directionId}>
            <ApiSelect
              value={editForm.data.directionId ? String(editForm.data.directionId) : 'none'}
              onValueChange={(value) => editForm.setField('directionId', value === 'none' ? null : Number(value))}
              placeholder="Seleccionar dirección"
              options={directions}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando direcciones..."
              errorMessage="Error al cargar las direcciones"
              emptyMessage="No hay direcciones disponibles"
            />
          </FormField>
          <FormField label="Tipo de Reserva" required error={editForm.errors.reserveTypeId}>
            <ApiSelect
              value={String(editForm.data.reserveTypeId)}
              onValueChange={(value) => editForm.setField('reserveTypeId', Number(value))}
              placeholder="Seleccionar tipo"
              options={[
                { id: '1', value: '1', label: 'Ida' },
                { id: '2', value: '2', label: 'Ida y Vuelta' },
              ]}
            />
          </FormField>
          <FormField label="Precio ($)" required error={editForm.errors.price}>
            <Input
              type="number"
              value={editForm.data.price || ''}
              onChange={(e) => editForm.setField('price', e.target.value ? Number(e.target.value) : 0)}
              min="0"
              step="100"
              placeholder="Ingrese el precio"
            />
          </FormField>
          <FormField label="Orden" required error={editForm.errors.order}>
            <Input
              type="number"
              value={editForm.data.order || ''}
              onChange={(e) => editForm.setField('order', e.target.value ? Number(e.target.value) : 1)}
              min="1"
              placeholder="Orden de la parada"
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente el precio."
      />
    </div>
  );
}
