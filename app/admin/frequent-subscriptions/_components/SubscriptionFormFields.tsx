'use client';

import { useEffect, useMemo } from 'react';
import { FormField } from '@/components/dashboard/form-field';
import { Input } from '@/components/ui/input';
import { ApiSelect, type SelectOption } from '@/components/dashboard/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ServiceListItem } from '@/interfaces/serviceList';
import { Direction } from '@/interfaces/direction';
import { Passenger } from '@/interfaces/passengers';
import {
  RESERVE_TYPE_OPTIONS,
  ReserveType,
} from '@/interfaces/frequentSubscription';

type FormState = {
  data: Record<string, any>;
  errors: Record<string, string | undefined>;
  setField: (name: string, value: any) => void;
};

interface SubscriptionFormFieldsProps {
  /** El hook useFormValidation (sólo expone los campos que usamos). */
  form: FormState;
  /** Services Active provistos por GET /services-list (purpose-built para este form). */
  services: ServiceListItem[];
  /** Lista global de Directions — se filtra por service.allowedDirectionIds. */
  directions: Direction[];
  /** Lista de clientes (cacheada). */
  customers: Passenger[];

  /** En 'edit' los campos inmutables quedan disabled con tooltip. */
  mode: 'create' | 'edit';

  /**
   * En edit: indica si la suscripción ya comenzó (startDate ≤ hoy).
   * Si true, el campo startDate también se deshabilita.
   * Backend valida lo mismo con `CannotChangeStartDateAlreadyStarted`.
   */
  alreadyStarted?: boolean;
}

const IMMUTABLE_TOOLTIP = 'Para cambiar, cancelá la suscripción y creá una nueva.';

/**
 * Renderiza los campos del form de FrequentSubscription. Se usa en los modales
 * de creación (todos editables) y edición (Customer/Tipo/Servicios disabled).
 *
 * Comportamiento smart (post backend Mayo 2026):
 *  - Service dropdown: etiqueta `{tripDescription} · {dayOfWeekName} {departureHour}`.
 *  - Inbound Service dropdown filtra solo a Services con trip inverso del Outbound
 *    elegido (origenes y destinos swappeados). Si coincide el mismo dayOfWeek, queda
 *    primero (alinea con la promo IdaVuelta cuando RoundTripRequiresSameDay).
 *  - Pickup/Dropoff cruza service.allowedDirectionIds con la lista global de Directions.
 *    Si allowedDirectionIds está vacío, **todas** las Directions son válidas.
 *  - Cascading reset: cambiar el Service del leg blanquea sus 2 directionIds.
 */
export function SubscriptionFormFields({
  form,
  services,
  directions,
  customers,
  mode,
  alreadyStarted = false,
}: SubscriptionFormFieldsProps) {
  const isIdaVuelta = Number(form.data.reserveTypeId) === ReserveType.IdaVuelta;
  const isEdit = mode === 'edit';

  // ----- lookups -----
  const servicesById = useMemo(() => {
    const m = new Map<number, ServiceListItem>();
    services.forEach((s) => m.set(s.serviceId, s));
    return m;
  }, [services]);

  const directionsById = useMemo(() => {
    const m = new Map<number, Direction>();
    directions.forEach((d) => m.set(d.directionId, d));
    return m;
  }, [directions]);

  const outboundService = servicesById.get(Number(form.data.outboundServiceId));
  const inboundService = servicesById.get(Number(form.data.inboundServiceId));

  // ----- cascading reset -----
  useEffect(() => {
    if (isEdit) return; // edit: el dropdown está disabled, no hace falta
    form.setField('outboundPickupLocationId', 0);
    form.setField('outboundDropoffLocationId', 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data.outboundServiceId]);

  useEffect(() => {
    if (isEdit) return;
    if (!isIdaVuelta) {
      form.setField('inboundServiceId', null);
      form.setField('inboundPickupLocationId', null);
      form.setField('inboundDropoffLocationId', null);
    } else {
      form.setField('inboundPickupLocationId', 0);
      form.setField('inboundDropoffLocationId', 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data.reserveTypeId, form.data.inboundServiceId]);

  // ----- options builders -----

  // Sólo Customers Active para el combo del form de alta/edición. El array crudo
  // `customers` se mantiene unfiltered porque el FilterBar de la grilla
  // (frequent-subscriptions/page.tsx) lo reusa con política opuesta —
  // necesita ver Customers Inactive/Suspended para filtrar suscripciones viejas.
  const customerOptions: SelectOption[] = useMemo(
    () =>
      customers
        .filter((c) => c.status === 'Activo')
        .map((c) => ({
          id: c.customerId,
          value: String(c.customerId),
          label: `${c.firstName} ${c.lastName}`.trim(),
        })),
    [customers]
  );

  const outboundServiceOptions: SelectOption[] = useMemo(
    () =>
      services.map((s) => ({
        id: s.serviceId,
        value: String(s.serviceId),
        label: formatServiceLabel(s),
      })),
    [services]
  );

  /**
   * Smart filter del Inbound: solo Services con trip inverso del Outbound
   * (origin/destination swappeados). Si coincide el dayOfWeek, ordeno primero
   * porque alinea con la promo IdaVuelta `RoundTripRequiresSameDay`.
   */
  const inboundServiceOptions: SelectOption[] = useMemo(() => {
    if (!outboundService) return [];
    const candidates = services.filter(
      (s) =>
        s.originCityId === outboundService.destinationCityId &&
        s.destinationCityId === outboundService.originCityId
    );
    const sameDayFirst = [...candidates].sort((a, b) => {
      const aMatch = a.dayOfWeek === outboundService.dayOfWeek ? 0 : 1;
      const bMatch = b.dayOfWeek === outboundService.dayOfWeek ? 0 : 1;
      return aMatch - bMatch;
    });
    return sameDayFirst.map((s) => ({
      id: s.serviceId,
      value: String(s.serviceId),
      label: formatServiceLabel(s),
    }));
  }, [outboundService, services]);

  /**
   * Devuelve las Directions válidas para un leg (pickup o dropoff) de un Service.
   *
   * Lógica:
   *   1. Filtro por **ciudad del leg**: pickup → origen del Service, dropoff → destino.
   *      Esto evita mezclar Directions de ciudades que no tienen nada que ver con el Trip.
   *   2. Si `service.allowedDirectionIds` tiene whitelist, intersecto con la ciudad
   *      (whitelist + city). Si está vacía, uso todas las de la ciudad
   *      (regla del backend: whitelist vacía = sin restricción explícita,
   *      pero la ciudad sigue siendo el constraint natural).
   */
  const directionOptionsForLeg = (
    svc: ServiceListItem | undefined,
    cityId: number | undefined
  ): SelectOption[] => {
    if (!svc || cityId == null) return [];
    const whitelist = svc.allowedDirectionIds ?? [];

    const pool: Direction[] =
      whitelist.length === 0
        ? directions
        : whitelist
            .map((id) => directionsById.get(id))
            .filter((d): d is Direction => Boolean(d));

    return pool
      .filter((d) => d.cityId === cityId)
      .map((d) => ({
        id: d.directionId,
        value: String(d.directionId),
        label: d.name,
      }));
  };

  const outboundPickupOptions = directionOptionsForLeg(
    outboundService,
    outboundService?.originCityId
  );
  const outboundDropoffOptions = directionOptionsForLeg(
    outboundService,
    outboundService?.destinationCityId
  );
  const inboundPickupOptions = directionOptionsForLeg(
    inboundService,
    inboundService?.originCityId
  );
  const inboundDropoffOptions = directionOptionsForLeg(
    inboundService,
    inboundService?.destinationCityId
  );

  // ----- helpers para edit-disabled con tooltip -----

  const immutableProps = (disabled: boolean) =>
    disabled
      ? { disabled: true, title: IMMUTABLE_TOOLTIP }
      : { disabled: false };

  return (
    <>
      {isEdit && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          Los cambios aplican sólo a las próximas reservas. Las ya generadas
          mantienen sus valores actuales. Si necesitás editar una reserva
          existente, hacelo desde el panel de la reserva.
        </div>
      )}

      <FormField label="Cliente" required error={form.errors.customerId}>
        <div {...immutableProps(isEdit)}>
          <ApiSelect
            searchable
            searchPlaceholder="Buscar cliente..."
            placeholder={
              customerOptions.length === 0 ? 'Cargando clientes...' : 'Seleccioná cliente'
            }
            value={form.data.customerId ? String(form.data.customerId) : ''}
            onValueChange={(v) => form.setField('customerId', v ? Number(v) : 0)}
            options={customerOptions}
            disabled={isEdit}
          />
        </div>
      </FormField>

      <FormField label="Tipo de reserva" required error={form.errors.reserveTypeId}>
        <RadioGroup
          value={String(form.data.reserveTypeId ?? ReserveType.Ida)}
          onValueChange={(v) => form.setField('reserveTypeId', Number(v))}
          className="flex flex-row gap-6"
          disabled={isEdit}
        >
          {RESERVE_TYPE_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className="flex items-center gap-2"
              title={isEdit ? IMMUTABLE_TOOLTIP : undefined}
            >
              <RadioGroupItem
                value={String(opt.value)}
                id={`reserveType-${opt.value}`}
                disabled={isEdit}
              />
              <Label htmlFor={`reserveType-${opt.value}`} className="cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FormField>

      <FormField label="Servicio Ida" required error={form.errors.outboundServiceId}>
        <div {...immutableProps(isEdit)}>
          <ApiSelect
            placeholder={
              outboundServiceOptions.length === 0
                ? 'Cargando servicios...'
                : 'Seleccioná servicio'
            }
            value={form.data.outboundServiceId ? String(form.data.outboundServiceId) : ''}
            onValueChange={(v) => form.setField('outboundServiceId', v ? Number(v) : 0)}
            options={outboundServiceOptions}
            disabled={isEdit}
          />
        </div>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Dirección de subida (Ida)"
          required
          error={form.errors.outboundPickupLocationId}
        >
          <ApiSelect
            placeholder={
              !outboundService
                ? 'Elegí primero un Servicio Ida'
                : outboundPickupOptions.length === 0
                ? 'No hay direcciones en la ciudad origen'
                : 'Seleccioná dirección'
            }
            value={
              form.data.outboundPickupLocationId
                ? String(form.data.outboundPickupLocationId)
                : ''
            }
            onValueChange={(v) =>
              form.setField('outboundPickupLocationId', v ? Number(v) : 0)
            }
            options={outboundPickupOptions}
            disabled={outboundPickupOptions.length === 0}
          />
        </FormField>
        <FormField
          label="Dirección de bajada (Ida)"
          required
          error={form.errors.outboundDropoffLocationId}
        >
          <ApiSelect
            placeholder={
              !outboundService
                ? 'Elegí primero un Servicio Ida'
                : outboundDropoffOptions.length === 0
                ? 'No hay direcciones en la ciudad destino'
                : 'Seleccioná dirección'
            }
            value={
              form.data.outboundDropoffLocationId
                ? String(form.data.outboundDropoffLocationId)
                : ''
            }
            onValueChange={(v) =>
              form.setField('outboundDropoffLocationId', v ? Number(v) : 0)
            }
            options={outboundDropoffOptions}
            disabled={outboundDropoffOptions.length === 0}
          />
        </FormField>
      </div>

      {isIdaVuelta && (
        <>
          <FormField
            label="Servicio Vuelta"
            required
            error={form.errors.inboundServiceId}
            description={
              outboundService
                ? `Filtrado a servicios con trip inverso (${outboundService.tripDescription} ↔).`
                : undefined
            }
          >
            <div {...immutableProps(isEdit)}>
              <ApiSelect
                placeholder={
                  !outboundService
                    ? 'Elegí primero un Servicio Ida'
                    : inboundServiceOptions.length === 0
                    ? 'No hay servicios de vuelta para esa ruta'
                    : 'Seleccioná servicio de vuelta'
                }
                value={
                  form.data.inboundServiceId ? String(form.data.inboundServiceId) : ''
                }
                onValueChange={(v) =>
                  form.setField('inboundServiceId', v ? Number(v) : null)
                }
                options={inboundServiceOptions}
                disabled={isEdit || !outboundService}
              />
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Dirección de subida (Vuelta)"
              required
              error={form.errors.inboundPickupLocationId}
            >
              <ApiSelect
                placeholder={
                  !inboundService
                    ? 'Elegí primero un Servicio Vuelta'
                    : inboundPickupOptions.length === 0
                    ? 'No hay direcciones en la ciudad origen'
                    : 'Seleccioná dirección'
                }
                value={
                  form.data.inboundPickupLocationId
                    ? String(form.data.inboundPickupLocationId)
                    : ''
                }
                onValueChange={(v) =>
                  form.setField('inboundPickupLocationId', v ? Number(v) : null)
                }
                options={inboundPickupOptions}
                disabled={inboundPickupOptions.length === 0}
              />
            </FormField>
            <FormField
              label="Dirección de bajada (Vuelta)"
              required
              error={form.errors.inboundDropoffLocationId}
            >
              <ApiSelect
                placeholder={
                  !inboundService
                    ? 'Elegí primero un Servicio Vuelta'
                    : inboundDropoffOptions.length === 0
                    ? 'No hay direcciones en la ciudad destino'
                    : 'Seleccioná dirección'
                }
                value={
                  form.data.inboundDropoffLocationId
                    ? String(form.data.inboundDropoffLocationId)
                    : ''
                }
                onValueChange={(v) =>
                  form.setField('inboundDropoffLocationId', v ? Number(v) : null)
                }
                options={inboundDropoffOptions}
                disabled={inboundDropoffOptions.length === 0}
              />
            </FormField>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Fecha desde"
          required
          error={form.errors.startDate}
          description={
            isEdit && alreadyStarted
              ? 'No editable: la suscripción ya comenzó.'
              : undefined
          }
        >
          <Input
            type="date"
            value={form.data.startDate ?? ''}
            onChange={(e) => form.setField('startDate', e.target.value)}
            disabled={isEdit && alreadyStarted}
            title={isEdit && alreadyStarted ? IMMUTABLE_TOOLTIP : undefined}
          />
        </FormField>
        <FormField
          label="Fecha hasta"
          error={form.errors.endDate}
          description="Opcional. Dejar vacío para vigencia indefinida."
        >
          <Input
            type="date"
            value={form.data.endDate ?? ''}
            onChange={(e) => form.setField('endDate', e.target.value || null)}
          />
        </FormField>
      </div>
    </>
  );
}

/**
 * Etiqueta canónica para el dropdown de Servicios.
 *
 * Formato: `{tripDescription} · {dayOfWeekName} {HH:mm}`
 * Ejemplo: `Lobos a CABA · Lunes 08:00`
 *
 * Fallback si falta alguna pieza:
 *  - Sin tripDescription: usa `name`.
 *  - Sin dayOfWeekName/departureHour: omite la parte slot.
 */
function formatServiceLabel(s: ServiceListItem): string {
  const head = s.tripDescription || s.name;
  const hourShort = s.departureHour ? s.departureHour.slice(0, 5) : '';
  const slot = [s.dayOfWeekName, hourShort].filter(Boolean).join(' ');
  return slot ? `${head} · ${slot}` : head;
}
