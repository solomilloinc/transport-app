import { describe, it, expect, vi } from 'vitest';
import {
  getApiErrorMessage,
  getApiErrorToastMessage,
  getApiErrorCode,
  bindApiErrorToForm,
  API_ERROR_CATALOG,
  FALLBACK_MESSAGE,
} from '@/lib/apiErrors';

const apiError = (code: string, extras?: unknown) =>
  new Error(`API_ERROR:${code}${extras !== undefined ? `|${JSON.stringify(extras)}` : ''}`);

describe('getApiErrorMessage', () => {
  it('devuelve el mensaje canónico del catálogo para un código conocido', () => {
    const info = getApiErrorMessage(apiError('FrequentSubscription.CapacityExceeded'));
    expect(info.code).toBe('FrequentSubscription.CapacityExceeded');
    expect(info.message).toBe(API_ERROR_CATALOG['FrequentSubscription.CapacityExceeded'].message);
  });

  it('resuelve los códigos canónicos de Service/Vehicle', () => {
    expect(getApiErrorMessage(apiError('Service.NotFound')).message).toBe('El servicio no existe.');
    expect(getApiErrorMessage(apiError('VehicleType.NotFound')).message).toBe(
      'El tipo de vehículo no existe.',
    );
  });

  it('mapea Reserve.HasActivePassengers (cancelar viaje con pasajeros activos)', () => {
    const info = getApiErrorMessage(apiError('Reserve.HasActivePassengers'));
    expect(info.code).toBe('Reserve.HasActivePassengers');
    expect(info.message).toBe(API_ERROR_CATALOG['Reserve.HasActivePassengers'].message);
    expect(info.message).not.toBe(FALLBACK_MESSAGE);
  });

  it('cae al mensaje base y avisa en dev para un código desconocido', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = getApiErrorMessage(apiError('Algo.Inexistente'));
    expect(info.message).toBe(FALLBACK_MESSAGE);
    expect(info.code).toBe('Algo.Inexistente');
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('cae al mensaje base para errores que no son de la API', () => {
    const info = getApiErrorMessage(new Error('boom'));
    expect(info.code).toBeNull();
    expect(info.message).toBe(FALLBACK_MESSAGE);
  });

  it('computa el field dinámico desde details (DirectionNotAllowedForService)', () => {
    const info = getApiErrorMessage(
      apiError('FrequentSubscription.DirectionNotAllowedForService', {
        details: { leg: 'inbound', kind: 'dropoff' },
      }),
    );
    expect(info.field).toBe('inboundDropoffLocationId');
  });
});

describe('getApiErrorToastMessage', () => {
  it('lista los mensajes específicos de una validación agregada', () => {
    const msg = getApiErrorToastMessage(
      apiError('Validation.General', {
        errors: [
          { code: 'Validation.CustomerId', description: 'CustomerId es obligatorio.' },
          { code: 'Validation.ReturnReserveId', description: 'ReturnReserveId es obligatorio para IdaVuelta.' },
        ],
      }),
    );
    expect(msg).toBe('CustomerId es obligatorio. ReturnReserveId es obligatorio para IdaVuelta.');
    // NO debe quedarse con el genérico del catálogo.
    expect(msg).not.toBe(API_ERROR_CATALOG['Validation.General'].message);
  });

  it('deduplica mensajes repetidos', () => {
    const msg = getApiErrorToastMessage(
      apiError('Validation.General', {
        errors: [
          { code: 'Validation.Passengers[0].Outbound.Price', description: 'El precio no puede ser negativo.' },
          { code: 'Validation.Passengers[1].Outbound.Price', description: 'El precio no puede ser negativo.' },
        ],
      }),
    );
    expect(msg).toBe('El precio no puede ser negativo.');
  });

  it('limita a 3 mensajes y agrega elipsis', () => {
    const msg = getApiErrorToastMessage(
      apiError('Validation.General', {
        errors: [
          { code: 'Validation.A', description: 'Uno.' },
          { code: 'Validation.B', description: 'Dos.' },
          { code: 'Validation.C', description: 'Tres.' },
          { code: 'Validation.D', description: 'Cuatro.' },
        ],
      }),
    );
    expect(msg).toBe('Uno. Dos. Tres. …');
  });

  it('cae al mensaje canónico cuando no hay sub-errores de campo', () => {
    expect(getApiErrorToastMessage(apiError('Reserve.VehicleNotAvailable'))).toBe(
      API_ERROR_CATALOG['Reserve.VehicleNotAvailable'].message,
    );
  });
});

describe('getApiErrorCode', () => {
  it('extrae sólo el código', () => {
    expect(getApiErrorCode(apiError('Reserve.PriceNotAvailable'))).toBe('Reserve.PriceNotAvailable');
    expect(getApiErrorCode(apiError('Reserve.PriceNotAvailable', { details: { a: 1 } }))).toBe(
      'Reserve.PriceNotAvailable',
    );
    expect(getApiErrorCode(new Error('otro'))).toBe('');
  });
});

describe('bindApiErrorToForm', () => {
  it('subraya el field estático del catálogo', () => {
    const setError = vi.fn();
    const bound = bindApiErrorToForm(apiError('FrequentSubscription.InvalidDateRange'), setError);
    expect(bound).toBe(true);
    expect(setError).toHaveBeenCalledWith('endDate', expect.any(String));
  });

  it('mapea los sub-errores Validation.<Campo> a inputs camelCase', () => {
    const setError = vi.fn();
    bindApiErrorToForm(
      apiError('Validation.General', {
        errors: [
          { code: 'Validation.StartDate', description: 'requerido' },
          { code: 'Validation.OutboundPickupLocationId', description: 'inválido' },
        ],
      }),
      setError,
    );
    expect(setError).toHaveBeenCalledWith('startDate', 'requerido');
    expect(setError).toHaveBeenCalledWith('outboundPickupLocationId', 'inválido');
  });

  it('no hace binding cuando no hay field ni sub-errores', () => {
    const setError = vi.fn();
    const bound = bindApiErrorToForm(apiError('FrequentSubscription.AlreadyCancelled'), setError);
    expect(bound).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
