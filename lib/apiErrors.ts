/**
 * Catálogo y normalización de errores de la API — fuente única del copy que ve
 * el usuario final (ver `docs/adr/0001-frontend-owns-user-facing-error-copy.md`).
 *
 * La API devuelve ProblemDetails (RFC 7807). `services/api.ts` lo reescribe a
 * `Error('API_ERROR:<code>')` o `Error('API_ERROR:<code>|<extras-json>')`, donde
 * `<extras-json>` es `{ details?, errors? }`. Este módulo:
 *
 * 1. Mantiene `API_ERROR_CATALOG`: `code → { message, field? }` con el copy
 *    canónico en español. El `code` del backend es el contrato; el texto es
 *    nuestro. NUNCA mostramos el `detail` del backend directamente.
 * 2. `getApiErrorMessage(err)` → mensaje para el toast (catálogo o mensaje base).
 * 3. `bindApiErrorToForm(err, setError)` → subraya el/los campo(s) culpable(s),
 *    tanto por el `field` del catálogo como por los sub-errores `Validation.<Campo>`
 *    que FluentValidation manda en `errors[]`.
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
 * Para `DirectionNotAllowedForService` se espera:
 *   { leg: 'outbound' | 'inbound', kind: 'pickup' | 'dropoff' }
 */
export type ApiErrorDetails = Record<string, unknown>;

/** Mensaje base mostrado cuando un código no está en el catálogo o no se pudo identificar. */
export const FALLBACK_MESSAGE = 'Ocurrió un error inesperado. Intentá nuevamente.';

/**
 * Catálogo de códigos de error conocidos. Las claves son los strings que el
 * backend devuelve como `code` (en ProblemDetails, el `title`). Espejo del
 * inventario de `*Error.cs` del backend.
 *
 * Convención del backend: `Cat.SubCode` (ver su CLAUDE.md). Algunos códigos
 * legacy son de una sola palabra (`ServiceNotFound`, `VehicleNotFound`, ...) o
 * usan el nombre del campo como sub-código (`City.CityId`, `Driver.Document`).
 * Mantenemos la clave EXACTA que manda el backend hoy; cuando exista el código
 * canónico además, se agrega como alias apuntando al mismo mensaje.
 */
export const API_ERROR_CATALOG: Record<string, ApiErrorEntry> = {
  // ── FrequentSubscription ──────────────────────────────────────────────────
  'FrequentSubscription.NotFound': {
    message: 'La suscripción ya no existe.',
  },
  'FrequentSubscription.InvalidIdaConfig': {
    message: 'Para una suscripción Ida no se debe especificar servicio ni datos de vuelta.',
  },
  'FrequentSubscription.InvalidIdaVueltaConfig': {
    message: 'Para Ida y Vuelta se requieren el servicio de vuelta y los puntos de subida/bajada.',
  },
  'FrequentSubscription.InvalidDateRange': {
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
    field: 'endDate',
  },
  'FrequentSubscription.CannotChangeImmutableFields': {
    message:
      'No se pueden modificar el cliente, los servicios ni el tipo de reserva. Cancelá la suscripción y creá una nueva.',
  },
  'FrequentSubscription.CannotChangeStartDateAlreadyStarted': {
    message: 'No se puede cambiar la fecha de inicio de una suscripción que ya comenzó.',
    field: 'startDate',
  },
  'FrequentSubscription.AlreadyCancelled': {
    message: 'La suscripción ya no está activa.',
  },
  'FrequentSubscription.DirectionNotAllowedForService': {
    message: 'El punto de subida o bajada elegido no está habilitado para este servicio.',
    field: (details) => directionFieldFromDetails(details),
  },
  'FrequentSubscription.CapacityExceeded': {
    message: 'No hay cupo: se alcanzó el máximo de suscripciones para este servicio.',
  },
  'FrequentSubscription.OverlapWithExistingSubscription': {
    message: 'El cliente ya tiene una suscripción activa para este servicio.',
  },

  // ── Customer ──────────────────────────────────────────────────────────────
  'Customer.NotFound': { message: 'No se encontró el cliente.' },
  'Customer.AlreadyExists': { message: 'Ya existe un cliente con ese número de documento.' },
  'Customer.Inactive': { message: 'El cliente no está activo.' },
  'Customer.HasActiveSubscriptions': {
    message: 'No se puede eliminar el cliente: tiene suscripciones activas. Cancelálas primero.',
  },

  // ── CustomerReserve ───────────────────────────────────────────────────────
  'CustomerReserve.CustomerId': { message: 'El cliente seleccionado no existe.' },
  'CustomerReserve.Reserve': { message: 'La reserva seleccionada no existe.' },
  'CustomerReserve.PickupLocation': { message: 'El lugar de subida es incorrecto.' },
  'CustomerReserve.DropoffLocation': { message: 'El lugar de bajada es incorrecto.' },

  // ── Service ───────────────────────────────────────────────────────────────
  'Service.NotFound': { message: 'El servicio no existe.' },
  'Service.SlotConflict': {
    message: 'Ya existe un servicio activo para ese tramo, día y horario.',
  },
  'Service.ServiceNotActive': { message: 'El servicio no existe o no está activo.' },
  'Service.HasActiveSubscriptions': {
    message:
      'No se puede modificar el servicio: tiene suscripciones activas. Cancelálas primero.',
  },
  'Service.VehicleCapacityBelowSubscriptions': {
    message:
      'El vehículo elegido tiene capacidad insuficiente para las suscripciones existentes. Cancelá suscripciones o elegí un vehículo más grande.',
  },

  // ── Reserve ───────────────────────────────────────────────────────────────
  'Reserve.NotFound': { message: 'La reserva no fue encontrada.' },
  'Reserve.NotAvailable': { message: 'La reserva no está disponible.' },
  'Reserve.PriceNotAvailable': {
    message:
      'El precio cotizado ya no está disponible. Recargá la página para ver los precios actualizados.',
  },
  'Reserve.VehicleNotAvailable': {
    message: 'No hay suficientes asientos disponibles para esta reserva.',
  },
  'Reserve.PassengerAlreadyExists': {
    message: 'El pasajero ya está agregado a la reserva.',
  },
  'Reserve.InvalidPaymentAmount': {
    message: 'El monto pagado no coincide con el precio esperado.',
  },
  'Reserve.InvalidReserveCombination': {
    message: 'La combinación de reserva no es válida.',
  },
  'Reserve.OverPaymentNotAllowed': {
    message: 'El monto pagado supera el monto pendiente.',
  },
  'Reserve.AlreadyFullyPaid': { message: 'La reserva ya está completamente pagada.' },
  'Reserve.NoDebtToSettle': {
    message: 'No hay deuda pendiente en las reservas seleccionadas.',
  },
  'Reserve.SlotAlreadyTaken': {
    message: 'Ya existe una reserva para ese tramo, fecha y horario.',
  },

  // ── Passenger ─────────────────────────────────────────────────────────────
  'Passenger.NotFound': { message: 'El pasajero no fue encontrado.' },

  // ── City (códigos con sub-código = nombre de campo) ───────────────────────
  'City.CityId': { message: 'La ciudad no existe.' },
  'City.Code': { message: 'Ya existe una ciudad con esa información.' },
  'City.HasDirections': {
    message: 'No se puede eliminar una ciudad con direcciones asociadas.',
  },

  // ── Direction ─────────────────────────────────────────────────────────────
  'Direction.DirectionId': { message: 'La dirección no existe.' },

  // ── Vehicle ───────────────────────────────────────────────────────────────
  'Vehicle.NotFound': { message: 'El vehículo no existe.' },
  'Vehicle.AlreadyExists': { message: 'Ya existe un vehículo con ese número interno.' },
  'Vehicle.NotActive': { message: 'El vehículo no está activo.' },
  'Vehicle.AvailableQuantity': {
    message: 'La cantidad de asientos disponibles no puede superar la del tipo de vehículo.',
  },

  // ── VehicleType ───────────────────────────────────────────────────────────
  'VehicleType.NotFound': { message: 'El tipo de vehículo no existe.' },
  'VehicleType.InUse': {
    message: 'No se puede eliminar un tipo de vehículo asignado a coches activos.',
  },

  // ── Driver (sub-código = nombre de campo) ─────────────────────────────────
  'Driver.DriverId': { message: 'El chofer no existe.' },
  'Driver.DocumentInvalid': { message: 'Este documento no está permitido.' },
  'Driver.Document': { message: 'Ya existe un chofer con ese documento.' },
  'Driver.HasFutureReserves': {
    message: 'No se puede eliminar un chofer con viajes futuros asignados.',
  },

  // ── Trip ──────────────────────────────────────────────────────────────────
  'Trip.NotFound': { message: 'El viaje no existe.' },
  'Trip.AlreadyExists': { message: 'Ya existe un viaje con ese origen y destino.' },
  'TripPrice.NotFound': { message: 'No se encontró el precio del viaje.' },
  'TripPrice.AlreadyExists': {
    message: 'Ya existe un precio para esa ciudad y tipo de reserva en este viaje.',
  },
  'Trip.InvalidConfiguration': { message: 'El origen y el destino deben ser distintos.' },
  'Trip.NotActive': { message: 'El viaje no está activo.' },
  'TripPickupStop.NotFound': { message: 'No se encontró la parada de subida del viaje.' },
  'TripPickupStop.AlreadyExists': {
    message: 'Ya existe una parada de subida para este viaje.',
  },

  // ── CashBox ───────────────────────────────────────────────────────────────
  'CashBox.NotFound': { message: 'No se encontró la caja.' },
  'CashBox.AlreadyClosed': { message: 'La caja ya está cerrada.' },
  'CashBox.NoOpenCashBox': {
    message: 'No hay ninguna caja abierta. Abrí una caja antes de registrar pagos.',
  },
  'CashBox.CannotCloseWithPendingPayments': {
    message: 'No se puede cerrar la caja con pagos pendientes.',
  },

  // ── ReserveSlotLock (flujo de reserva del cliente) ────────────────────────
  'ReserveSlotLock.InsufficientSlots': {
    message: 'No hay suficientes cupos disponibles para la reserva.',
  },
  'ReserveSlotLock.InvalidOrExpiredLock': {
    message: 'El bloqueo es inválido o expiró. Iniciá el proceso de reserva nuevamente.',
  },
  'ReserveSlotLock.LockReserveMismatch': {
    message: 'Las reservas solicitadas no coinciden con el bloqueo.',
  },
  'ReserveSlotLock.LockAlreadyUsed': {
    message: 'Este bloqueo ya fue utilizado para crear una reserva.',
  },
  'ReserveSlotLock.LockNotFound': { message: 'No se encontró el bloqueo.' },
  'ReserveSlotLock.MaxSimultaneousLocksExceeded': {
    message: 'Alcanzaste el límite de reservas simultáneas en proceso.',
  },
  'ReserveSlotLock.LockExpired': {
    message: 'El bloqueo expiró. Iniciá el proceso de reserva nuevamente.',
  },

  // ── Usuario / autenticación ───────────────────────────────────────────────
  'User.Login': { message: 'El usuario o la contraseña son incorrectos.' },
  'User.RefreshToken': { message: 'Tu sesión expiró. Iniciá sesión nuevamente.' },
  'User.RefreshToken.Reused': {
    message: 'Tu sesión se cerró por seguridad. Iniciá sesión nuevamente.',
  },
  'User.RefreshToken.Expired': { message: 'Tu sesión expiró. Iniciá sesión nuevamente.' },
  Unauthorized: { message: 'Tu sesión expiró. Iniciá sesión nuevamente.' },

  // ── Tenant (infraestructura: el usuario no puede accionar, copy neutral) ──
  'Tenant.NotFound': { message: 'Hubo un problema de configuración. Contactá al administrador.' },
  'Tenant.InvalidCode': {
    message: 'Hubo un problema de configuración. Contactá al administrador.',
  },
  'Tenant.CodeAlreadyExists': { message: 'Ya existe una organización con ese código.' },
  'Tenant.DomainAlreadyExists': { message: 'Ya existe una organización con ese dominio.' },
  'Tenant.MissingHeader': {
    message: 'Hubo un problema de configuración. Contactá al administrador.',
  },
  'Tenant.Mismatch': {
    message: 'Hubo un problema de configuración. Contactá al administrador.',
  },
  'Tenant.PaymentConfigNotFound': {
    message: 'La configuración de pago no está disponible. Contactá al administrador.',
  },

  // ── Validación agregada (FluentValidation) ────────────────────────────────
  'Validation.General': { message: 'Hay datos inválidos en el formulario. Revisá los campos marcados.' },
};

// ---------------------------------------------------------------------------
// Normalización del error
// ---------------------------------------------------------------------------

export type ApiFieldError = { code: string; description: string };

type ExtractedError = {
  code: string | null;
  details: ApiErrorDetails | null;
  fieldErrors: ApiFieldError[];
};

/**
 * Parsea el mensaje del Error lanzado por `services/api.ts`. Soporta:
 *   1. `API_ERROR:<code>`
 *   2. `API_ERROR:<code>|<json>` donde json = `{ details?, errors? }`
 */
function extractError(err: unknown): ExtractedError {
  const empty: ExtractedError = { code: null, details: null, fieldErrors: [] };
  if (!(err instanceof Error)) return empty;
  const match = /^API_ERROR:(.+)$/.exec(err.message);
  if (!match) return empty;

  const payload = match[1];
  const pipeIdx = payload.indexOf('|');
  if (pipeIdx === -1) return { code: payload, details: null, fieldErrors: [] };

  const code = payload.slice(0, pipeIdx);
  const jsonRaw = payload.slice(pipeIdx + 1);
  try {
    const parsed = JSON.parse(jsonRaw) as { details?: unknown; errors?: unknown };
    const details =
      parsed && typeof parsed === 'object' && parsed.details
        ? (parsed.details as ApiErrorDetails)
        : null;
    const fieldErrors = Array.isArray(parsed?.errors)
      ? (parsed.errors as ApiFieldError[]).filter(
          (e) => e && typeof e.code === 'string',
        )
      : [];
    return { code, details, fieldErrors };
  } catch {
    return { code, details: null, fieldErrors: [] };
  }
}

/** Devuelve sólo el código del error (o '' si no se pudo identificar). */
export function getApiErrorCode(err: unknown): string {
  return extractError(err).code ?? '';
}

export type ApiErrorInfo = {
  code: string | null;
  message: string;
  field?: string;
  details?: ApiErrorDetails | null;
  fieldErrors: ApiFieldError[];
};

/**
 * Devuelve `{ code, message, field?, details?, fieldErrors }` para cualquier error.
 * - Si el código está en el catálogo, usa el mensaje canónico (y campo estático
 *   o computado a partir de `details`).
 * - Si no, usa el mensaje base y, en dev, avisa por consola para que el hueco
 *   se note (ver `docs/adr/0001`).
 */
export function getApiErrorMessage(err: unknown): ApiErrorInfo {
  const { code, details, fieldErrors } = extractError(err);
  const entry = code ? API_ERROR_CATALOG[code] : undefined;

  if (entry) {
    const field =
      typeof entry.field === 'function' ? entry.field(details) : entry.field;
    return { code, message: entry.message, field, details, fieldErrors };
  }

  if (code && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[apiErrors] Código de API sin entrada en el catálogo: "${code}". ` +
        `Se mostró el mensaje base. Agregalo a API_ERROR_CATALOG en lib/apiErrors.ts.`,
    );
  }

  return { code, message: FALLBACK_MESSAGE, details, fieldErrors };
}

/**
 * Adapter framework-agnostic para subrayar un campo en cualquier form.
 * - react-hook-form: pasar `(name, msg) => setError(name, { type: 'server', message: msg })`
 * - useFormValidation (este repo): pasar el `setError(field, message)` que expone el hook.
 */
export type FormFieldErrorSetter = (field: string, message: string) => void;

/**
 * Subraya el/los campo(s) culpable(s) en el form vía `setError`. Devuelve `true`
 * si se hizo al menos un binding. Dos fuentes:
 *   1. El `field` del catálogo (códigos de dominio sin `errors[]`).
 *   2. Los sub-errores `Validation.<Campo>` de FluentValidation en `errors[]`,
 *      mapeando `<Campo>` (PascalCase del backend) al input camelCase del form.
 *
 * En este proyecto la convención es: SIEMPRE mostrar toast + opcionalmente
 * field-level. El caller normalmente ignora el boolean y muestra el toast siempre.
 */
export function bindApiErrorToForm(err: unknown, setError: FormFieldErrorSetter): boolean {
  const info = getApiErrorMessage(err);
  let bound = false;

  if (info.field) {
    setError(info.field, info.message);
    bound = true;
  }

  // Sub-errores por campo de FluentValidation. El mensaje es el del validador
  // del backend (hint específico del campo); si quisiéramos overridearlo, se
  // agrega una entrada `Validation.<Campo>` al catálogo.
  for (const fe of info.fieldErrors) {
    const field = formFieldFromValidationCode(fe.code);
    if (!field) continue;
    const override = API_ERROR_CATALOG[fe.code]?.message;
    setError(field, override ?? fe.description ?? info.message);
    bound = true;
  }

  return bound;
}

// ---------------------------------------------------------------------------
// Detail / field resolvers
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

/**
 * Mapea un código `Validation.<PropertyName>` (FluentValidation) al nombre del
 * campo del form. El backend usa PascalCase (`StartDate`); los forms de este
 * repo usan camelCase (`startDate`). Devuelve `undefined` si no es un código
 * de validación de campo.
 */
function formFieldFromValidationCode(code: string): string | undefined {
  const prefix = 'Validation.';
  if (!code.startsWith(prefix)) return undefined;
  const prop = code.slice(prefix.length);
  if (!prop || prop === 'General') return undefined;
  return prop.charAt(0).toLowerCase() + prop.slice(1);
}
