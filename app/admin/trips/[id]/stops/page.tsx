'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Trash, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteLogic, get, post, put } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { DeleteDialog } from '@/components/dashboard/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { PagedResponse } from '@/services/types';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Direction } from '@/interfaces/direction';
import { useFormValidation } from '@/hooks/use-form-validation';
import { Trip, TripPickupStopReportDto, emptyTripPickupStopForm } from '@/interfaces/trip';
import { getTripById } from '@/services/trip';

const tripDirectionValidationSchema = {
  directionId: {
    required: { message: 'La dirección es requerida' },
  },
  order: {
    required: { message: 'El orden es requerido' },
  },
  pickupTimeOffset: {
    required: { message: 'El tiempo de subida es requerido' },
  },
};

export default function TripStopsManagement() {
  const params = useParams();
  const router = useRouter();
  const tripId = Number(params.id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrip = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await getTripById(id);
      setTrip(response);
    } catch (error) {
      console.error('[TripStopsPage] Error loading trip:', error);
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
  const [currentStopId, setCurrentStopId] = useState<number | null>(null);

  const addForm = useFormValidation({ ...emptyTripPickupStopForm, tripId }, tripDirectionValidationSchema);
  const editForm = useFormValidation(emptyTripPickupStopForm, tripDirectionValidationSchema);

  const [directions, setDirections] = useState<SelectOption[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Load directions eagerly when trip is available
  useEffect(() => {
    if (!trip) return;
    const loadDirections = async () => {
      try {
        setIsOptionsLoading(true);
        setOptionsError(null);
        const response = await get<any, PagedResponse<Direction>>('/direction-report', {
          pageNumber: 1,
          pageSize: 100,
          sortBy: 'fecha',
          sortDescending: true,
          filters: {},
        });
        console.log('[TripStopsPage] direction-report response:', response);
        if (response?.Items) {
          const originDirections = response.Items.filter(
            (d: Direction) => d.CityId === trip.OriginCityId
          );
          const formattedDirections = originDirections.map((direction: Direction) => ({
            id: direction.DirectionId.toString(),
            value: direction.DirectionId.toString(),
            label: direction.Name,
          }));
          console.log('[TripStopsPage] Formatted directions:', formattedDirections);
          setDirections(formattedDirections);
        }
      } catch (error) {
        console.error('[TripStopsPage] Error loading directions:', error);
        setOptionsError('Error al cargar las direcciones');
      } finally {
        setIsOptionsLoading(false);
      }
    };
    loadDirections();
  }, [trip]);

  // Strip seconds from HH:mm:ss to HH:mm for time input
  const stripSeconds = (time: string): string => {
    if (!time) return '';
    const parts = time.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
  };

  // Append :00 seconds to HH:mm for API
  const appendSeconds = (time: string): string => {
    if (!time) return '';
    const parts = time.split(':');
    return parts.length === 2 ? `${time}:00` : time;
  };

  const submitAddStop = async () => {
    addForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          TripId: tripId,
          DirectionId: data.directionId,
          Order: data.order,
          PickupTimeOffset: appendSeconds(data.pickupTimeOffset),
        };
        const response = await post('/trip-pickup-stop-create', transformedData);
        if (response) {
          toast({
            title: 'Parada agregada',
            description: 'La parada ha sido agregada exitosamente',
            variant: 'success',
          });
          setIsAddModalOpen(false);
          fetchTrip(tripId);
        } else {
          toast({
            title: 'Error',
            description: 'Error al agregar la parada',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al agregar la parada',
          variant: 'destructive',
        });
      }
    });
  };

  const submitEditStop = async () => {
    editForm.handleSubmit(async (data) => {
      try {
        const transformedData = {
          DirectionId: data.directionId,
          Order: data.order,
          PickupTimeOffset: appendSeconds(data.pickupTimeOffset),
        };
        const response = await put(`/trip-pickup-stop-update/${currentStopId}`, transformedData);
        if (response) {
          toast({
            title: 'Parada actualizada',
            description: 'La parada ha sido actualizada exitosamente',
            variant: 'success',
          });
          setIsEditModalOpen(false);
          fetchTrip(tripId);
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar la parada',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar la parada',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAddStop = () => {
    setCurrentStopId(null);
    addForm.resetForm();
    addForm.setField('tripId', tripId);
    setIsAddModalOpen(true);
  };

  const handleEditStop = (stop: TripPickupStopReportDto) => {
    setCurrentStopId(stop.TripPickupStopId);
    editForm.setField('directionId', stop.DirectionId);
    editForm.setField('order', stop.Order);
    editForm.setField('pickupTimeOffset', stripSeconds(stop.PickupTimeOffset));
    setIsEditModalOpen(true);
  };

  const handleDeleteStop = (id: number) => {
    setCurrentStopId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    await deleteLogic(`/trip-pickup-stop-delete/${currentStopId}`);
    setIsDeleteModalOpen(false);
    setCurrentStopId(null);
    fetchTrip(tripId);
  };

  const stops = trip?.StopSchedules || [];

  const columns = [
    { header: 'Dirección', accessor: 'DirectionName', width: '25%' },
    { header: 'Ciudad', accessor: 'CityName', width: '20%' },
    { header: 'Orden', accessor: 'Order', width: '15%' },
    {
      header: 'Tiempo Offset',
      accessor: 'PickupTimeOffset',
      width: '20%',
      cell: (stop: TripPickupStopReportDto) => `+${stripSeconds(stop.PickupTimeOffset)}`,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '20%',
      cell: (stop: TripPickupStopReportDto) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditStop(stop)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeleteStop(stop.TripPickupStopId)}
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
        title={`Paradas: ${trip?.Description || ''}`}
        description={`${trip?.OriginCityName} → ${trip?.DestinationCityName}`}
        action={
          <Button onClick={handleAddStop}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Parada
          </Button>
        }
      />

      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={stops}
                emptyMessage="No hay paradas configuradas."
                isLoading={isLoading}
                skeletonRows={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile view */}
      <div className="md:hidden space-y-4 mt-4">
        {stops.length > 0 ? (
          stops.map((stop) => (
            <MobileCard
              key={stop.TripPickupStopId}
              title={stop.DirectionName}
              subtitle={stop.CityName}
              fields={[
                { label: 'Orden', value: String(stop.Order) },
                { label: 'Tiempo Offset', value: `+${stripSeconds(stop.PickupTimeOffset)}` },
              ]}
              onEdit={() => handleEditStop(stop)}
              onDelete={() => handleDeleteStop(stop.TripPickupStopId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">No hay paradas configuradas.</div>
        )}
      </div>

      {/* Add Stop Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Agregar Parada"
        description="Configura una nueva parada intermedia para esta ruta."
        onSubmit={submitAddStop}
        submitText="Agregar Parada"
      >
        <div className="space-y-4">
          <FormField label="Dirección" required error={addForm.errors.directionId}>
            <ApiSelect
              value={String(addForm.data.directionId)}
              onValueChange={(value) => addForm.setField('directionId', Number(value))}
              placeholder="Seleccionar dirección"
              options={directions}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando direcciones..."
              errorMessage="Error al cargar las direcciones"
              emptyMessage="No hay direcciones disponibles"
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
          <FormField label="Tiempo de Subida (HH:mm)" required error={addForm.errors.pickupTimeOffset}>
            <Input
              type="time"
              value={addForm.data.pickupTimeOffset || ''}
              onChange={(e) => addForm.setField('pickupTimeOffset', e.target.value)}
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Edit Stop Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Parada"
        description="Modifica los detalles de la parada."
        onSubmit={submitEditStop}
        submitText="Guardar Cambios"
      >
        <div className="space-y-4">
          <FormField label="Dirección" required error={editForm.errors.directionId}>
            <ApiSelect
              value={String(editForm.data.directionId)}
              onValueChange={(value) => editForm.setField('directionId', Number(value))}
              placeholder="Seleccionar dirección"
              options={directions}
              loading={isOptionsLoading}
              error={optionsError}
              loadingMessage="Cargando direcciones..."
              errorMessage="Error al cargar las direcciones"
              emptyMessage="No hay direcciones disponibles"
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
          <FormField label="Tiempo de Subida (HH:mm)" required error={editForm.errors.pickupTimeOffset}>
            <Input
              type="time"
              value={editForm.data.pickupTimeOffset || ''}
              onChange={(e) => editForm.setField('pickupTimeOffset', e.target.value)}
            />
          </FormField>
        </div>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente la parada."
      />
    </div>
  );
}
