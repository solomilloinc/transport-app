import { describe, it, expect, vi, beforeEach } from 'vitest';

// `services/api.ts` es `'use server'` y arrastra a `getServerAxios`; lo mockeamos
// para probar la lógica del action de forma aislada.
vi.mock('@/services/api', () => ({ put: vi.fn() }));

import { put } from '@/services/api';
import { cancelReserveTripAction } from '@/app/admin/reserves/actions';
import { API_ERROR_CATALOG, FALLBACK_MESSAGE } from '@/lib/apiErrors';

const putMock = vi.mocked(put);

describe('cancelReserveTripAction', () => {
  beforeEach(() => putMock.mockReset());

  it('cancela y devuelve ok en éxito', async () => {
    putMock.mockResolvedValue(true);
    await expect(cancelReserveTripAction(42)).resolves.toEqual({ ok: true });
    expect(putMock).toHaveBeenCalledWith(
      '/reserve-update/42',
      expect.objectContaining({ status: 2 }), // ReserveStatusEnum.Cancelled
    );
  });

  it('mapea el código de validación a un mensaje y NO lanza (evita el 500)', async () => {
    // `put` lanza de forma síncrona a propósito: así no queda una promesa
    // rechazada colgando que Vitest reporte como "unhandled error" (y contamine
    // otros archivos de test). El `catch` del action la captura igual.
    putMock.mockImplementation(() => {
      throw new Error('API_ERROR:Reserve.HasActivePassengers');
    });
    const result = await cancelReserveTripAction(42);
    expect(result).toEqual({
      ok: false,
      code: 'Reserve.HasActivePassengers',
      message: API_ERROR_CATALOG['Reserve.HasActivePassengers'].message,
    });
  });

  it('cae al mensaje base si el backend responde sin confirmar', async () => {
    putMock.mockResolvedValue(false);
    const result = await cancelReserveTripAction(42);
    expect(result).toEqual({ ok: false, code: '', message: FALLBACK_MESSAGE });
  });
});
