'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Plus, Trash, Route, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { City } from '@/interfaces/city';
import { useFormValidation } from '@/hooks/use-form-validation';
import { getTrips } from '@/services/trip';
import { Trip, emptyTripForm } from '@/interfaces/trip';

const tripValidationSchema = {
  description: {
    required: { message: 'La descripción es requerida' },
  },
  originCityId: {
    required: { message: 'La ciudad de origen es requerida' },
  },
  destinationCityId: {
    required: { message: 'La ciudad de destino es requerida' },
  },
};

export default function TripManagement() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);

  const addForm = useFormValidation(emptyTripForm, tripValidationSchema);
  const editForm = useFormValidation(emptyTripForm, tripValidationSchema);

  const [cities, setCities] = useState<SelectOption[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [data, setData] = useState<PagedResponse<Trip> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async (page?: number) => {
    try {
      setLoading(true);
      const params: Partial<PaginationParams> = {
        pageNumber: page ?? currentPage,
        pageSize: 10,
      };
      if (searchQuery) {
        (params as any).filters = { search: searchQuery };
      }
      const response = await getTrips(params);
      setData(response);
    } catch (error) {
      console.error('[TripManagement] Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar las rutas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const loadCities = async () => {
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
        const formattedCities = response.Items.map((city: City) => ({
          id: city.Id.toString(),
          value: city.Id.toString(),
          label: city.Name,
        }));
        setCities(formattedCities);
      }
    } catch (error) {
      setOptionsError('Error al cargar las ciudades');
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const submitAddTrip = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          Description: data.description,
          OriginCityId: data.originCityId,
          DestinationCityId: data.destinationCityId,
        };
        const response = await post('/trip-create', transformedData);
        if (response) {
          toast({
            title: 'Ruta creada',
            description: 'La ruta ha sido creada exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetchTrips(currentPage);
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear la ruta',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear la ruta',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditTrip = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          Description: data.description,
          OriginCityId: data.originCityId,
          DestinationCityId: data.destinationCityId,
        };
        const response = await put(`/trip-update/${currentTripId}`, transformedData);
        if (response) {
          toast({
            title: 'Ruta actualizada',
            description: 'La ruta ha sido actualizada exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetchTrips(currentPage);
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar la ruta',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar la ruta',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddTrip = () => {
    setCurrentTripId(null);
    addForm.resetForm();
    setIsAddModalOpen(true);
    loadCities();
  };

  const handleEditTrip = (trip: Trip) => {
    setCurrentTripId(trip.TripId);
    editForm.setField('description', trip.Description);
    editForm.setField('originCityId', trip.OriginCityId);
    editForm.setField('destinationCityId', trip.DestinationCityId);
    setIsEditModalOpen(true);
    loadCities();
  };

  const handleDeleteTrip = (id: number) => {
    setCurrentTripId(id);
    setIsDeleteModalOpen(true);
  };

  const handleManagePrices = (tripId: number) => {
    router.push(`/admin/trips/${tripId}/prices`);
  };

  const confirmDelete = async () => {
    await deleteLogic(`/trip-delete/${currentTripId}`);
    setIsDeleteModalOpen(false);
    setCurrentTripId(null);
    fetchTrips(currentPage);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const columns = [
    { header: 'Descripción', accessor: 'Description', width: '25%' },
    { header: 'Origen', accessor: 'OriginCityName', width: '20%' },
    { header: 'Destino', accessor: 'DestinationCityName', width: '20%' },
    {
      header: 'Precios',
      accessor: 'Prices',
      width: '10%',
      cell: (trip: Trip) => trip.Prices?.length || 0,
    },
    {
      header: 'Estado',
      accessor: 'Status',
      className: 'text-center',
      width: '10%',
      cell: (trip: Trip) => <StatusBadge status={trip.Status} />,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '15%',
      cell: (trip: Trip) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => handleManagePrices(trip.TripId)}
            title="Gestionar Precios"
          >
            <DollarSign className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditTrip(trip)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeleteTrip(trip.TripId)}
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
        title="Rutas Comerciales"
        description="Gestiona las rutas comerciales y sus precios asociados."
        action={
          <Button onClick={handleAddTrip}>
            <Route className="mr-2 h-4 w-4" />
            Nueva Ruta
          </Button>
        }
      />

      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <FilterBar onReset={resetFilters}>
              <SearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por descripción..." />
            </FilterBar>

            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={data?.Items ?? []}
                emptyMessage="No se encontraron rutas."
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
                itemName="rutas"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile view */}
      <div className="md:hidden space-y-4 mt-4">
        {loading ? (
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
          data?.Items?.map((trip) => (
            <MobileCard
              key={trip.TripId}
              title={trip.Description}
              subtitle={`${trip.OriginCityName} → ${trip.DestinationCityName}`}
              badge={<StatusBadge status={trip.Status} />}
              fields={[
                { label: 'Precios', value: `${trip.Prices?.length || 0} configurados` },
              ]}
              onEdit={() => handleEditTrip(trip)}
              onDelete={() => handleDeleteTrip(trip.TripId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No se encontraron rutas.</div>
        )}
      </div>

      {/* Add Trip Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Nueva Ruta Comercial"
        description="Crea una nueva ruta comercial entre dos ciudades."
        onSubmit={submitAddTrip}
        submitText="Crear Ruta"
      >
        <div className="space-y-4">
          <FormField label="Descripción" required error={addForm.errors.description}>
            <Input
              placeholder="Ej: Córdoba - San Juan"
              value={addForm.data.description}
              onChange={(e) => addForm.setField('description', e.target.value)}
            />
          </FormField>
          <FormField label="Ciudad Origen" required error={addForm.errors.originCityId}>
            <ApiSelect
              value={String(addForm.data.originCityId)}
              onValueChange={(value) => addForm.setField('originCityId', Number(value))}
              placeholder="Seleccionar ciudad de origen"
              options={cities}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
          <FormField label="Ciudad Destino" required error={addForm.errors.destinationCityId}>
            <ApiSelect
              value={String(addForm.data.destinationCityId)}
              onValueChange={(value) => addForm.setField('destinationCityId', Number(value))}
              placeholder="Seleccionar ciudad de destino"
              options={cities.filter(c => c.id !== String(addForm.data.originCityId))}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Edit Trip Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Ruta Comercial"
        description="Modifica los detalles de la ruta comercial."
        onSubmit={submitEditTrip}
        submitText="Guardar Cambios"
      >
        <div className="space-y-4">
          <FormField label="Descripción" required error={editForm.errors.description}>
            <Input
              placeholder="Ej: Córdoba - San Juan"
              value={editForm.data.description}
              onChange={(e) => editForm.setField('description', e.target.value)}
            />
          </FormField>
          <FormField label="Ciudad Origen" required error={editForm.errors.originCityId}>
            <ApiSelect
              value={String(editForm.data.originCityId)}
              onValueChange={(value) => editForm.setField('originCityId', Number(value))}
              placeholder="Seleccionar ciudad de origen"
              options={cities}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
          <FormField label="Ciudad Destino" required error={editForm.errors.destinationCityId}>
            <ApiSelect
              value={String(editForm.data.destinationCityId)}
              onValueChange={(value) => editForm.setField('destinationCityId', Number(value))}
              placeholder="Seleccionar ciudad de destino"
              options={cities.filter(c => c.id !== String(editForm.data.originCityId))}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando ciudades..."
              errorMessage="Error al cargar las ciudades"
              emptyMessage="No hay ciudades disponibles"
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente la ruta y todos sus precios asociados."
      />
    </div>
  );
}
