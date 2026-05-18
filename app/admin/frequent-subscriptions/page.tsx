'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit, Repeat, UserPlusIcon, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/dashboard/page-header';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ApiSelect } from '@/components/dashboard/select';
import { toast } from '@/hooks/use-toast';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useReportFilters } from '@/hooks/use-report-filters';
import { enumParser, numberParser } from '@/hooks/url-parsers';
import { EntityStatus } from '@/interfaces/filters/common';
import {
  emptyFrequentSubscriptionCreate,
  FrequentSubscriptionCancelPreview,
  FrequentSubscriptionResponseDto,
  isActiveSubscriptionStatus,
  ReserveType,
  RESERVE_TYPE_OPTIONS,
} from '@/interfaces/frequentSubscription';
import {
  FrequentSubscriptionReportFilters,
  emptyFrequentSubscriptionReportFilters,
} from '@/interfaces/filters/frequent-subscription-filters';
import {
  validationConfigFrequentSubscription,
  validationConfigFrequentSubscriptionEdit,
} from '@/validations/frequentSubscriptionSchema';
import {
  cancelFrequentSubscription,
  createFrequentSubscription,
  getFrequentSubscriptionCancelPreview,
  getFrequentSubscriptionReport,
  updateFrequentSubscription,
} from '@/services/frequentSubscription';
import { bindApiErrorToForm, getApiErrorMessage } from '@/lib/apiErrors';
import { getCustomerReport } from '@/services/passenger';
import { getServicesList } from '@/services/serviceList';
import { getDirectionReport } from '@/services/direction';
import { Passenger } from '@/interfaces/passengers';
import { ServiceListItem } from '@/interfaces/serviceList';
import { Direction } from '@/interfaces/direction';
import { SubscriptionFormFields } from './_components/SubscriptionFormFields';
import { CancelSubscriptionDialog } from './_components/CancelSubscriptionDialog';

const filterParsers = {
  customerId: numberParser,
  outboundServiceId: numberParser,
  reserveTypeId: enumParser<ReserveType>([ReserveType.Ida, ReserveType.IdaVuelta]),
  status: enumParser<EntityStatus>([
    EntityStatus.Active,
    EntityStatus.Inactive,
    EntityStatus.Deleted,
    EntityStatus.Suspended,
  ]),
} as const;

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: String(EntityStatus.Active), label: 'Activas' },
  // En este dominio, status=2 = Cancelada (ver CONTEXT.md y FRONTEND_SERVICIOS_CLIENTE.md).
  { value: String(EntityStatus.Inactive), label: 'Canceladas' },
];

const RESERVE_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  ...RESERVE_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label })),
];

const CUSTOMERS_PAGE_SIZE = 500;
const DIRECTIONS_PAGE_SIZE = 500;

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Devuelve "hoy + 1 mes" en formato ISO yyyy-mm-dd.
 * Si el día no existe en el mes siguiente (e.g. 31 Mar + 1 mes), JS normaliza
 * al día 1 del mes siguiente. Para un default UX eso es aceptable.
 */
const oneMonthFromTodayIso = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

export default function FrequentSubscriptionsPage() {
  // ----- lookups cacheados -----
  // services-list trae solo Services Active con la metadata necesaria para el form
  // (tripDescription, dayOfWeek, departureHour, origin/destinationCityId, allowedDirectionIds).
  // Más liviano que service-report y purpose-built para este caso.
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [customers, setCustomers] = useState<Passenger[]>([]);
  // Directions globales: se cruzan con service.allowedDirectionIds para
  // renderear los dropdowns de pickup/dropoff con sus nombres.
  const [directions, setDirections] = useState<Direction[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [svcRes, custRes, dirRes] = await Promise.all([
          getServicesList(),
          getCustomerReport({ pageSize: CUSTOMERS_PAGE_SIZE }),
          getDirectionReport({ pageSize: DIRECTIONS_PAGE_SIZE }),
        ]);
        setServices(svcRes ?? []);
        setCustomers(custRes.items ?? []);
        setDirections(dirRes.items ?? []);
      } catch (err) {
        toast({
          title: 'Error',
          description: getApiErrorMessage(err).message,
          variant: 'destructive',
        });
      }
    })();
  }, []);

  // ----- modales -----
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<FrequentSubscriptionResponseDto | null>(null);
  // Resultado del preview cargado antes de abrir el cancel modal.
  // null = aún cargando / preview falló: la dialog muestra copy genérico.
  const [cancelPreview, setCancelPreview] =
    useState<FrequentSubscriptionCancelPreview | null>(null);

  // ----- forms -----
  // Defaults del create: startDate = hoy, endDate = hoy + 1 mes (sensata vigencia
  // por defecto; el admin puede borrarla para dejarla indefinida).
  const addForm = useFormValidation(
    {
      ...emptyFrequentSubscriptionCreate,
      startDate: todayIso(),
      endDate: oneMonthFromTodayIso(),
    },
    validationConfigFrequentSubscription
  );
  const editForm = useFormValidation(
    emptyFrequentSubscriptionCreate as any,
    validationConfigFrequentSubscriptionEdit
  );

  // ----- listing -----
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
  } = useReportFilters<
    FrequentSubscriptionReportFilters,
    FrequentSubscriptionResponseDto
  >({
    defaults: emptyFrequentSubscriptionReportFilters,
    parsers: filterParsers as any,
    apiCall: getFrequentSubscriptionReport,
    initialPageSize: 10,
    initialSortBy: 'startdate',
    initialSortDescending: true,
  });

  // ----- handlers -----
  const handleAdd = () => {
    addForm.resetForm();
    // resetForm rehidrata con initial, pero queremos defaults frescos cada vez
    // que se abre el dialog (cubre el caso de dejar el dialog abierto un día
    // y volver al siguiente).
    addForm.setField('startDate', todayIso());
    addForm.setField('endDate', oneMonthFromTodayIso());
    setIsAddModalOpen(true);
  };

  const handleEdit = (sub: FrequentSubscriptionResponseDto) => {
    setCurrentSubscription(sub);
    editForm.resetForm();
    // Hidrato TODOS los campos (incluso los inmutables) para que el form se
    // visualice completo en read-only. Sólo los editables se mandan en el PUT.
    editForm.setField('customerId', sub.customerId);
    editForm.setField('reserveTypeId', sub.reserveTypeId);
    editForm.setField('outboundServiceId', sub.outboundServiceId);
    editForm.setField('inboundServiceId', sub.inboundServiceId);
    editForm.setField('outboundPickupLocationId', sub.outboundPickupLocationId);
    editForm.setField('outboundDropoffLocationId', sub.outboundDropoffLocationId);
    editForm.setField('inboundPickupLocationId', sub.inboundPickupLocationId);
    editForm.setField('inboundDropoffLocationId', sub.inboundDropoffLocationId);
    editForm.setField('startDate', sub.startDate?.slice(0, 10) ?? '');
    editForm.setField('endDate', sub.endDate?.slice(0, 10) ?? null);
    setIsEditModalOpen(true);
  };

  const handleCancel = async (sub: FrequentSubscriptionResponseDto) => {
    // Limpiamos preview previo y abrimos el modal optimistamente (con copy
    // genérico mientras carga). Si el preview vuelve OK, la dialog se
    // re-renderea con números concretos.
    setCurrentSubscription(sub);
    setCancelPreview(null);
    setIsCancelModalOpen(true);

    try {
      const preview = await getFrequentSubscriptionCancelPreview(sub.frequentSubscriptionId);
      // Solo aplicamos si seguimos viendo la misma sub (el admin pudo
      // haber cerrado el modal antes de que llegue la respuesta).
      setCancelPreview((current) =>
        current === null ? preview : current
      );
    } catch (err) {
      const info = getApiErrorMessage(err);
      // Si la sub ya estaba cancelada / no existe, cerramos modal y refresca grilla.
      if (
        info.code === 'FrequentSubscription.AlreadyCancelled' ||
        info.code === 'FrequentSubscription.NotFound'
      ) {
        setIsCancelModalOpen(false);
        setCurrentSubscription(null);
        toast({
          title: 'Suscripción no activa',
          description: info.message,
          variant: 'destructive',
        });
        refetch();
        return;
      }
      // Otros errores: dejamos el modal con copy genérico y solo logueamos
      // un toast informativo. El admin puede confirmar igual.
      toast({
        title: 'No se pudo cargar el detalle',
        description: 'Continuá con la confirmación o cerrá para reintentar.',
        variant: 'destructive',
      });
    }
  };

  const submitAdd = async () => {
    addForm.handleSubmit(async (formData) => {
      try {
        // Normalizo inbound* a null si es Ida.
        const isIdaVuelta = Number(formData.reserveTypeId) === ReserveType.IdaVuelta;
        const payload = {
          customerId: Number(formData.customerId),
          reserveTypeId: Number(formData.reserveTypeId) as ReserveType,
          outboundServiceId: Number(formData.outboundServiceId),
          outboundPickupLocationId: Number(formData.outboundPickupLocationId),
          outboundDropoffLocationId: Number(formData.outboundDropoffLocationId),
          inboundServiceId: isIdaVuelta ? Number(formData.inboundServiceId) : null,
          inboundPickupLocationId: isIdaVuelta
            ? Number(formData.inboundPickupLocationId)
            : null,
          inboundDropoffLocationId: isIdaVuelta
            ? Number(formData.inboundDropoffLocationId)
            : null,
          startDate: formData.startDate as string,
          endDate: (formData.endDate as string) || null,
        };

        await createFrequentSubscription(payload);
        // Desde Mayo 2026 el create aplica la suscripción inmediatamente sobre
        // las Reserves existentes en la ventana — los Passengers ya quedan
        // creados al volver de este POST. No hace falta disparar el batch.
        toast({
          title: 'Suscripción creada',
          description: 'Los pasajes ya quedaron generados en las reservas existentes.',
          variant: 'success',
        });
        setIsAddModalOpen(false);
        refetch();
      } catch (err) {
        bindApiErrorToForm(err, addForm.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(err).message,
          variant: 'destructive',
        });
      }
    });
  };

  const submitEdit = async () => {
    editForm.handleSubmit(async (formData) => {
      if (!currentSubscription) return;
      try {
        const isIdaVuelta = currentSubscription.reserveTypeId === ReserveType.IdaVuelta;
        const payload = {
          outboundPickupLocationId: Number(formData.outboundPickupLocationId),
          outboundDropoffLocationId: Number(formData.outboundDropoffLocationId),
          inboundPickupLocationId: isIdaVuelta
            ? Number(formData.inboundPickupLocationId)
            : null,
          inboundDropoffLocationId: isIdaVuelta
            ? Number(formData.inboundDropoffLocationId)
            : null,
          startDate: formData.startDate as string,
          endDate: (formData.endDate as string) || null,
        };

        await updateFrequentSubscription(currentSubscription.frequentSubscriptionId, payload);
        toast({
          title: 'Suscripción actualizada',
          description: 'Los cambios se aplican a las próximas reservas generadas.',
          variant: 'success',
        });
        setIsEditModalOpen(false);
        refetch();
      } catch (err) {
        bindApiErrorToForm(err, editForm.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(err).message,
          variant: 'destructive',
        });
      }
    });
  };

  const confirmCancel = async () => {
    if (!currentSubscription) return;
    try {
      await cancelFrequentSubscription(currentSubscription.frequentSubscriptionId);
      toast({
        title: 'Suscripción cancelada',
        description: 'Las reservas futuras fueron canceladas y los cargos reembolsados.',
        variant: 'success',
      });
      setIsCancelModalOpen(false);
      setCurrentSubscription(null);
      setCancelPreview(null);
      refetch();
    } catch (err) {
      const info = getApiErrorMessage(err);
      // Race condition / doble click: si ya estaba cancelada cerramos modal limpio.
      if (
        info.code === 'FrequentSubscription.AlreadyCancelled' ||
        info.code === 'FrequentSubscription.NotFound'
      ) {
        setIsCancelModalOpen(false);
        setCurrentSubscription(null);
        setCancelPreview(null);
        refetch();
      }
      toast({
        title: 'No se pudo cancelar',
        description: info.message,
        variant: 'destructive',
      });
    }
  };

  // ----- helpers de presentación -----
  const editAlreadyStarted = useMemo(() => {
    if (!currentSubscription?.startDate) return false;
    return currentSubscription.startDate.slice(0, 10) <= todayIso();
  }, [currentSubscription]);

  // ----- columnas grid -----
  const columns = [
    { header: 'Cliente', accessor: 'customerFullName', width: '15%' },
    {
      header: 'Tipo',
      accessor: 'reserveTypeId',
      width: '10%',
      cell: (s: FrequentSubscriptionResponseDto) =>
        s.reserveTypeId === ReserveType.IdaVuelta ? 'Ida y Vuelta' : 'Ida',
    },
    { header: 'Servicio Ida', accessor: 'outboundServiceName', width: '14%' },
    {
      header: 'Servicio Vuelta',
      accessor: 'inboundServiceName',
      width: '14%',
      cell: (s: FrequentSubscriptionResponseDto) => s.inboundServiceName ?? '—',
    },
    { header: 'Pickup Ida', accessor: 'outboundPickupLocationName', width: '10%' },
    { header: 'Dropoff Ida', accessor: 'outboundDropoffLocationName', width: '10%' },
    {
      header: 'Vigencia',
      accessor: 'startDate',
      width: '12%',
      cell: (s: FrequentSubscriptionResponseDto) =>
        formatRange(s.startDate, s.endDate),
    },
    {
      header: 'Estado',
      accessor: 'status',
      className: 'text-center',
      width: '8%',
      cell: (s: FrequentSubscriptionResponseDto) => (
        <StatusBadge status={isActiveSubscriptionStatus(s.status) ? 'Activa' : 'Cancelada'} />
      ),
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '12%',
      cell: (s: FrequentSubscriptionResponseDto) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEdit(s)}
            disabled={!isActiveSubscriptionStatus(s.status)}
            title={!isActiveSubscriptionStatus(s.status) ? 'Suscripción no activa' : 'Editar'}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => handleCancel(s)}
            disabled={!isActiveSubscriptionStatus(s.status)}
            title={!isActiveSubscriptionStatus(s.status) ? 'Suscripción no activa' : 'Cancelar'}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ----- options para filtros -----
  const customerFilterOptions = useMemo(
    () => [
      { id: 'all', value: 'all', label: 'Todos los clientes' },
      ...customers.map((c) => ({
        id: c.customerId,
        value: String(c.customerId),
        label: `${c.firstName} ${c.lastName}`.trim(),
      })),
    ],
    [customers]
  );

  const serviceFilterOptions = useMemo(
    () => [
      { id: 'all', value: 'all', label: 'Todos los servicios' },
      ...services.map((s) => ({
        id: s.serviceId,
        value: String(s.serviceId),
        label: s.name,
      })),
    ],
    [services]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pasajeros Frecuentes"
        description="Gestioná las suscripciones recurrentes de tus clientes."
        action={
          <Button onClick={handleAdd}>
            <UserPlusIcon className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        }
      />

      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <FilterBar onReset={reset} onApply={apply}>
              <ApiSelect
                searchable
                searchPlaceholder="Buscar cliente..."
                className="w-full sm:w-[220px]"
                value={draft.customerId !== undefined ? String(draft.customerId) : 'all'}
                onValueChange={(v) =>
                  setDraftField('customerId', v === 'all' ? undefined : Number(v))
                }
                options={customerFilterOptions}
                placeholder="Todos los clientes"
              />
              <ApiSelect
                className="w-full sm:w-[220px]"
                value={
                  draft.outboundServiceId !== undefined
                    ? String(draft.outboundServiceId)
                    : 'all'
                }
                onValueChange={(v) =>
                  setDraftField('outboundServiceId', v === 'all' ? undefined : Number(v))
                }
                options={serviceFilterOptions}
                placeholder="Todos los servicios"
              />
              <ApiSelect
                className="w-full sm:w-[160px]"
                value={
                  draft.reserveTypeId !== undefined ? String(draft.reserveTypeId) : 'all'
                }
                onValueChange={(v) =>
                  setDraftField(
                    'reserveTypeId',
                    v === 'all' ? undefined : (Number(v) as ReserveType)
                  )
                }
                options={RESERVE_TYPE_FILTER_OPTIONS.map((o) => ({
                  id: o.value,
                  value: o.value,
                  label: o.label,
                }))}
                placeholder="Todos los tipos"
              />
              <ApiSelect
                className="w-full sm:w-[160px]"
                value={draft.status !== undefined ? String(draft.status) : 'all'}
                onValueChange={(v) =>
                  setDraftField(
                    'status',
                    v === 'all' ? undefined : (Number(v) as EntityStatus)
                  )
                }
                options={STATUS_FILTER_OPTIONS.map((o) => ({
                  id: o.value,
                  value: o.value,
                  label: o.label,
                }))}
                placeholder="Activas"
              />
            </FilterBar>

            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={data?.items ?? []}
                emptyMessage="No se encontraron suscripciones."
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
                itemName="suscripciones"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4 mt-4">
        {loading && (!data?.items || data.items.length === 0) ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : data?.items?.length > 0 ? (
          data.items.map((s) => (
            <MobileCard
              key={s.frequentSubscriptionId}
              title={s.customerFullName}
              badge={
                <StatusBadge
                  status={isActiveSubscriptionStatus(s.status) ? 'Activa' : 'Cancelada'}
                />
              }
              fields={[
                {
                  label: 'Tipo',
                  value: s.reserveTypeId === ReserveType.IdaVuelta ? 'Ida y Vuelta' : 'Ida',
                },
                { label: 'Servicio Ida', value: s.outboundServiceName },
                ...(s.inboundServiceName
                  ? [{ label: 'Servicio Vuelta', value: s.inboundServiceName }]
                  : []),
                { label: 'Vigencia', value: formatRange(s.startDate, s.endDate) },
              ]}
              onEdit={isActiveSubscriptionStatus(s.status) ? () => handleEdit(s) : undefined}
              onDelete={isActiveSubscriptionStatus(s.status) ? () => handleCancel(s) : undefined}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">
            No se encontraron suscripciones.
          </div>
        )}
      </div>

      {/* Add modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Nueva suscripción"
        description="Configurá la suscripción recurrente para este cliente."
        onSubmit={submitAdd}
        submitText="Crear suscripción"
        isLoading={addForm.isSubmitting}
      >
        <SubscriptionFormFields
          form={addForm}
          services={services}
          customers={customers}
          directions={directions}
          mode="create"
        />
      </FormDialog>

      {/* Edit modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar suscripción"
        description="Solo pickup/dropoff y fechas son editables. El resto requiere cancelar y crear nueva."
        onSubmit={submitEdit}
        submitText="Guardar cambios"
        isLoading={editForm.isSubmitting}
      >
        <SubscriptionFormFields
          form={editForm}
          services={services}
          customers={customers}
          directions={directions}
          mode="edit"
          alreadyStarted={editAlreadyStarted}
        />
      </FormDialog>

      {/* Cancel modal */}
      <CancelSubscriptionDialog
        open={isCancelModalOpen}
        onOpenChange={(open) => {
          setIsCancelModalOpen(open);
          if (!open) {
            setCurrentSubscription(null);
            setCancelPreview(null);
          }
        }}
        onConfirm={confirmCancel}
        customerFullName={currentSubscription?.customerFullName ?? ''}
        preview={cancelPreview}
      />
    </div>
  );
}

/**
 * Formatea la vigencia de la suscripción para la grilla.
 *  "2026-05-20 → 2026-12-31" si tiene endDate
 *  "2026-05-20 → ∞"          si no
 */
function formatRange(startDate: string, endDate: string | null): string {
  const start = startDate?.slice(0, 10) ?? '';
  const end = endDate ? endDate.slice(0, 10) : '∞';
  return `${start} → ${end}`;
}
