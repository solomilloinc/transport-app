'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, Repeat, Search, User as UserIcon, UserPlusIcon, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ApiSelect } from '@/components/dashboard/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useApi } from '@/hooks/use-api';
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
import { getFrequentSubscriptionReport } from '@/services/frequentSubscription';
import { bindErrorInfoToForm, getApiErrorMessage } from '@/lib/apiErrors';
import {
  cancelFrequentSubscriptionAction,
  createFrequentSubscriptionAction,
  getFrequentSubscriptionCancelPreviewAction,
  updateFrequentSubscriptionAction,
} from '@/app/admin/frequent-subscriptions/actions';
import { getCustomerReport, getPassengers } from '@/services/passenger';
import { getServicesList } from '@/services/serviceList';
import { getDirectionReport } from '@/services/direction';
import { PaginationParams } from '@/services/types';
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

const DIRECTIONS_PAGE_SIZE = 500;
// Búsqueda server-side de clientes en el alta: traemos pocos resultados para
// empujar al admin a escribir más letras y afinar, en vez de listar todo.
const CUSTOMER_SEARCH_PAGE_SIZE = 10;
const CUSTOMER_SEARCH_MIN_CHARS = 3;

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function FrequentSubscriptionsPage() {
  // ----- lookups cacheados -----
  // services-list trae solo Services Active con la metadata necesaria para el form
  // (tripDescription, dayOfWeek, departureHour, origin/destinationCityId, allowedDirectionIds).
  // Más liviano que service-report y purpose-built para este caso.
  const [services, setServices] = useState<ServiceListItem[]>([]);
  // Directions globales: se cruzan con service.allowedDirectionIds para
  // renderear los dropdowns de pickup/dropoff con sus nombres.
  const [directions, setDirections] = useState<Direction[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [svcRes, dirRes] = await Promise.all([
          getServicesList(),
          getDirectionReport({ pageSize: DIRECTIONS_PAGE_SIZE }),
        ]);
        setServices(svcRes ?? []);
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

  // ----- búsqueda server-side de clientes para el ALTA -----
  // Antes el combo recibía hasta 500 clientes y filtraba en memoria. Ahora pega
  // al backend (customer-report con status=Active) recién a partir de
  // CUSTOMER_SEARCH_MIN_CHARS letras, trayendo CUSTOMER_SEARCH_PAGE_SIZE results.
  const [customerSearchResults, setCustomerSearchResults] = useState<Passenger[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerFilterSearch, setCustomerFilterSearch] = useState('');
  const [isCustomerFilterPopoverOpen, setIsCustomerFilterPopoverOpen] = useState(false);
  const { data: customerFilterResults, loading: customerFilterSearching, fetch: fetchCustomerFilter } =
    useApi<Passenger, PaginationParams>(getPassengers, { autoFetch: false });

  const searchActiveCustomers = useCallback(async (query: string) => {
    if (query.length < CUSTOMER_SEARCH_MIN_CHARS) {
      setCustomerSearchResults([]);
      return;
    }
    setCustomerSearchLoading(true);
    try {
      const res = await getCustomerReport({
        pageSize: CUSTOMER_SEARCH_PAGE_SIZE,
        filters: { search: query, status: EntityStatus.Active },
      });
      setCustomerSearchResults(res.items ?? []);
    } catch (err) {
      setCustomerSearchResults([]);
      toast({
        title: 'Error',
        description: getApiErrorMessage(err).message,
        variant: 'destructive',
      });
    } finally {
      setCustomerSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerFilterSearch.length >= CUSTOMER_SEARCH_MIN_CHARS) {
        fetchCustomerFilter({ filters: { search: customerFilterSearch.trim() } } as any);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerFilterSearch, fetchCustomerFilter]);

  const handleSelectCustomerFilter = (customer: Passenger) => {
    setCustomerFilterSearch(`${customer.lastName} ${customer.firstName}`);
    setDraftField('customerId', customer.customerId);
    setIsCustomerFilterPopoverOpen(false);
  };

  const resetCustomerFilter = () => {
    setCustomerFilterSearch('');
    setIsCustomerFilterPopoverOpen(false);
    setDraftField('customerId', undefined);
  };

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
  // Defaults del create: startDate = hoy, endDate = vacío (vigencia indefinida por
  // defecto; el admin la completa si quiere acotarla). `endDate` ya viene null en
  // emptyFrequentSubscriptionCreate — no lo override-eamos para no angostar el tipo
  // a `null` (rompería el cast `as string` del submit).
  const addForm = useFormValidation(
    {
      ...emptyFrequentSubscriptionCreate,
      startDate: todayIso(),
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
    // y volver al siguiente). endDate arranca vacío: vigencia indefinida.
    addForm.setField('startDate', todayIso());
    addForm.setField('endDate', null);
    setCustomerSearchResults([]); // combo arranca vacío: se llena al buscar
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

    const result = await getFrequentSubscriptionCancelPreviewAction(sub.frequentSubscriptionId);
    if (!result.ok) {
      // Si la sub ya estaba cancelada / no existe, cerramos modal y refresca grilla.
      if (
        result.code === 'FrequentSubscription.AlreadyCancelled' ||
        result.code === 'FrequentSubscription.NotFound'
      ) {
        setIsCancelModalOpen(false);
        setCurrentSubscription(null);
        toast({
          title: 'Suscripción no activa',
          description: result.message,
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
      return;
    }
    // Solo aplicamos si seguimos viendo la misma sub (el admin pudo
    // haber cerrado el modal antes de que llegue la respuesta).
    setCancelPreview((current) => (current === null ? result.data : current));
  };

  const submitAdd = async () => {
    addForm.handleSubmit(async (formData) => {
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

      const result = await createFrequentSubscriptionAction(payload);
      if (!result.ok) {
        bindErrorInfoToForm(result, addForm.setError);
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }
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
    });
  };

  const submitEdit = async () => {
    editForm.handleSubmit(async (formData) => {
      if (!currentSubscription) return;
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

      const result = await updateFrequentSubscriptionAction(
        currentSubscription.frequentSubscriptionId,
        payload,
      );
      if (!result.ok) {
        bindErrorInfoToForm(result, editForm.setError);
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Suscripción actualizada',
        description: 'Los cambios se aplican a las próximas reservas generadas.',
        variant: 'success',
      });
      setIsEditModalOpen(false);
      refetch();
    });
  };

  const confirmCancel = async () => {
    if (!currentSubscription) return;
    const result = await cancelFrequentSubscriptionAction(currentSubscription.frequentSubscriptionId);
    if (!result.ok) {
      // Race condition / doble click: si ya estaba cancelada cerramos modal limpio.
      if (
        result.code === 'FrequentSubscription.AlreadyCancelled' ||
        result.code === 'FrequentSubscription.NotFound'
      ) {
        setIsCancelModalOpen(false);
        setCurrentSubscription(null);
        setCancelPreview(null);
        refetch();
      }
      toast({ title: 'No se pudo cancelar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Suscripción cancelada',
      description: 'Las reservas futuras fueron canceladas y los cargos reembolsados.',
      variant: 'success',
    });
    setIsCancelModalOpen(false);
    setCurrentSubscription(null);
    setCancelPreview(null);
    refetch();
  };

  // ----- helpers de presentación -----
  const editAlreadyStarted = useMemo(() => {
    if (!currentSubscription?.startDate) return false;
    return currentSubscription.startDate.slice(0, 10) <= todayIso();
  }, [currentSubscription]);

  const currentSubscriptionCustomerOptions = useMemo<Passenger[]>(
    () =>
      currentSubscription
        ? [
            {
              customerId: currentSubscription.customerId,
              firstName: currentSubscription.customerFullName,
              lastName: '',
              email: '',
              phone1: '',
              phone2: '',
              documentNumber: '',
              status: '',
            },
          ]
        : [],
    [currentSubscription]
  );

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
    { header: 'Subida Ida', accessor: 'outboundPickupLocationName', width: '10%' },
    { header: 'Bajada Ida', accessor: 'outboundDropoffLocationName', width: '10%' },
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
            <div className="grid gap-4 lg:grid-cols-[220px_220px_140px_140px_auto] lg:items-end">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Cliente</span>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="frequent-subscription-customer-search"
                    placeholder="Buscar por nombre..."
                    className="pl-10"
                    value={customerFilterSearch}
                    autoComplete="off"
                    onFocus={() => setIsCustomerFilterPopoverOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setIsCustomerFilterPopoverOpen(false), 150);
                    }}
                    onChange={(e) => {
                      setCustomerFilterSearch(e.target.value);
                      setDraftField('customerId', undefined);
                      setIsCustomerFilterPopoverOpen(true);
                    }}
                  />
                  {isCustomerFilterPopoverOpen && (
                    <div className="absolute z-50 mt-1 w-[300px] rounded-md border bg-white shadow-md">
                      <div className="max-h-60 overflow-y-auto">
                        {customerFilterSearching ? (
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : (customerFilterResults?.items?.length ?? 0) > 0 ? (
                          customerFilterResults.items.map((p) => (
                            <div
                              key={p.customerId}
                              className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-0"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectCustomerFilter(p)}
                            >
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {p.lastName} {p.firstName}
                                </p>
                                <p className="text-xs text-gray-500">DNI: {p.documentNumber}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            {customerFilterSearch.length < CUSTOMER_SEARCH_MIN_CHARS
                              ? 'Escriba al menos 3 letras'
                              : 'No se encontraron pasajeros'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Servicio</span>
                <ApiSelect
                  className="w-full"
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
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Tipo</span>
                <ApiSelect
                  className="w-full"
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
                  placeholder="Todos"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Estado</span>
                <ApiSelect
                  className="w-full"
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
                  placeholder="Todas"
                />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button onClick={apply}>Aplicar</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetCustomerFilter();
                    reset();
                  }}
                >
                  Restablecer
                </Button>
              </div>
            </div>

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
          customers={customerSearchResults}
          onCustomerSearch={searchActiveCustomers}
          customerSearchLoading={customerSearchLoading}
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
          customers={currentSubscriptionCustomerOptions}
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
