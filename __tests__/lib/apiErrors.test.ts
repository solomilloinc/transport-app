import { describe, it, expect, vi } from 'vitest';
import {
  getApiErrorMessage,
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
