/**
 * Normalización de errores de la API.
 *
 * `services/api.ts` lanza `Error('API_ERROR:<code>')` o
 * `Error('API_ERROR:<code>|<details-json>')` cuando el backend responde con
 * `{ code, message, details? }`. Este módulo:
 *
 * 1. Mantiene un catálogo `code → { message, field? }` con los mensajes
 *    canónicos en español (extraídos de `docs/FRONTEND_SERVICIOS_CLIENTE.md`
 *    del repo backend).
 * 2. Expone `getApiErrorMessage(err)` para obtener el mensaje human-readable
 *    a mostrar en toasts.
 * 3. Expone `bindApiErrorToForm(err, setError)` para subrayar el campo
 *    culpable en formularios (cuando el catálogo o los `details` del backend
 *    permiten identificarlo).
 *
 * Patrón de uso típico en un handler de submit:
 *
 *   try { await postSomething(data); }
 *   catch (err) {
 *     bindApiErrorToForm(err, form.setError);
 *     toast({ description: getApiErrorMessage(err).message, variant: 'destructive' });
 *   }
 */

export type ApiErrorEntry = {
  /** Mensaje canónico en español a mostrar al usuario. */
  message: string;
  /**
   * Si el código del backend siempre apunta a un campo fijo del form,
   * se declara acá. Para códigos cuyo campo es dinámico (depende de `details`),
   * dejar el resolver como función — recibe los `details` parseados.
   */
  field?: string | ((details: ApiErrorDetails | null) => string | undefined);
};

/**
 * Forma libre que el backend puede enviar en `details`. Los campos están
 * documentados sólo cuando son consumidos acá; otros pueden aparecer y se
 * ignoran sin romper.
 *
 * Para `DirectionNotAllowedForService` se espera (mejora futura del backend):
 *   { leg: 'outbound' | 'inbound', kind: 'pickup' | 'dropoff' }
 */
export type ApiErrorDetails = Record<string, unknown>;

/**
 * Catálogo de códigos de error conocidos. Las claves son los strings que
 * el backend devuelve en `{ code }`. Los mensajes son verbatim de la doc
 * canónica `FRONTEND_SERVICIOS_CLIENTE.md` (líneas 132-141).
 */
export const API_ERROR_CATALOG: Record<string, ApiErrorEntry> = {
  // 400 — validación de payload
  'FrequentSubscription.InvalidIdaConfig': {
    message: 'Para una suscripción Ida no se debe especificar Service ni datos de Vuelta.',
  },
  'FrequentSubscription.InvalidIdaVueltaConfig': {
    message: 'Para IdaVuelta se requieren Service de Vuelta y pickup/dropoff.',
  },
  'FrequentSubscription.InvalidDateRange': {
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
    field: 'endDate',
  },
  'FrequentSubscription.DirectionNotAllowedForService': {
    message: 'El pickup o dropoff elegido no está habilitado para este servicio.',
    // Field dinámico: si el backend manda `details.leg` + `details.kind`,
    // apuntamos al input concreto. Si no, queda form-level + toast.
    field: (details) => directionFieldFromDetails(details),
  },
  'FrequentSubscription.CannotChangeStartDateAlreadyStarted': {
    message: 'No se puede cambiar la fecha de inicio de una suscripción que ya comenzó.',
    field: 'startDate',
  },

  // 404 — recursos inexistentes
  'FrequentSubscription.NotFound': {
    message: 'La suscripción ya no existe.',
  },

  // 409 — conflictos de estado
  'FrequentSubscription.AlreadyCancelled': {
    message: 'La suscripción ya no está activa.',
  },
  'FrequentSubscription.OverlapWithExistingSubscription': {
    message: 'El cliente ya tiene una suscripción activa para este servicio.',
  },
  'FrequentSubscription.CapacityExceeded': {
    message:
      'No hay cupo: ya alcanzaste el máximo de suscripciones para este servicio (capacidad del vehículo).',
  },
  'Customer.HasActiveSubscriptions': {
    message: 'No se puede eliminar el cliente: tiene suscripciones activas. Cancelálas primero.',
  },
  'Service.HasActiveSubscriptions': {
    message: 'No se puede desactivar/eliminar el servicio: tiene suscripciones activas.',
  },
  'Service.VehicleCapacityBelowSubscriptions': {
    message: 'El vehículo elegido tiene capacidad insuficiente para las suscripciones existentes.',
  },

  // Reserve / pricing — protección contra drift frontend↔backend en el split
  // de precios de IdaVuelta (convención Mayo 2026). Si el precio cotizado por
  // el frontend no matchea lo que el backend tiene en el catálogo, devuelve
  // este code. Mostramos un mensaje accionable: la fix es recargar las
  // pricing tables (recargar la página o cambiar de viaje y volver).
  'Reserve.PriceNotAvailable': {
    message: 'El precio cotizado ya no está disponible. Recargá la página para ver los precios actualizados.',
  },
};

const FALLBACK_MESSAGE = 'Ocurrió un error inesperado. Intentá nuevamente.';

/**
 * Parsea el mensaje del Error lanzado por `services/api.ts`. Soporta dos
 * formatos:
 *   1. Legacy: `API_ERROR:<code>`
 *   2. Con details: `API_ERROR:<code>|<json>`
 */
function extractCodeAndDetails(err: unknown): {
  code: string | null;
  details: ApiErrorDetails | null;
} {
  if (!(err instanceof Error)) return { code: null, details: null };
  const match = /^API_ERROR:(.+)$/.exec(err.message);
  if (!match) return { code: null, details: null };

  const payload = match[1];
  const pipeIdx = payload.indexOf('|');
  if (pipeIdx === -1) return { code: payload, details: null };

  const code = payload.slice(0, pipeIdx);
  const jsonRaw = payload.slice(pipeIdx + 1);
  try {
    const parsed = JSON.parse(jsonRaw);
    return { code, details: parsed as ApiErrorDetails };
  } catch {
    return { code, details: null };
  }
}

export type ApiErrorInfo = {
  code: string | null;
  message: string;
  field?: string;
  details?: ApiErrorDetails | null;
};

/**
 * Devuelve `{ code, message, field?, details? }` para cualquier error.
 * - Si el código está en el catálogo, devuelve el mensaje canónico (y campo
 *   estático o computado a partir de `details`).
 * - Si no, devuelve un fallback genérico.
 */
export function getApiErrorMessage(err: unknown): ApiErrorInfo {
  const { code, details } = extractCodeAndDetails(err);
  if (code && API_ERROR_CATALOG[code]) {
    const entry = API_ERROR_CATALOG[code];
    const field =
      typeof entry.field === 'function' ? entry.field(details) : entry.field;
    return { code, message: entry.message, field, details };
  }
  return { code, message: FALLBACK_MESSAGE, details };
}

/**
 * Adapter framework-agnostic para subrayar un campo en cualquier form.
 * - react-hook-form: pasar `(name, msg) => setError(name, { type: 'server', message: msg })`
 * - useFormValidation (este repo): pasar el `setError(field, message)` que expone el hook.
 */
export type FormFieldErrorSetter = (field: string, message: string) => void;

/**
 * Si el error tiene un campo asociado, lo subraya en el form vía `setError`.
 * Devuelve `true` si se hizo binding.
 *
 * En este proyecto la convención es: SIEMPRE mostrar toast + opcionalmente
 * field-level. El caller normalmente ignora el boolean y muestra el toast siempre.
 */
export function bindApiErrorToForm(err: unknown, setError: FormFieldErrorSetter): boolean {
  const info = getApiErrorMessage(err);
  if (info.field) {
    setError(info.field, info.message);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Detail resolvers
// ---------------------------------------------------------------------------

/**
 * Para `DirectionNotAllowedForService`: si el backend envía
 *   { leg: 'outbound' | 'inbound', kind: 'pickup' | 'dropoff' }
 * computamos el field name del form. Si falta cualquier pieza, devolvemos
 * `undefined` y el error queda form-level (toast).
 */
function directionFieldFromDetails(details: ApiErrorDetails | null): string | undefined {
  if (!details) return undefined;
  const leg = details.leg;
  const kind = details.kind;
  if (leg !== 'outbound' && leg !== 'inbound') return undefined;
  if (kind !== 'pickup' && kind !== 'dropoff') return undefined;
  const kindCap = kind === 'pickup' ? 'Pickup' : 'Dropoff';
  return `${leg}${kindCap}LocationId`;
}
