import { describe, it, expect, vi } from 'vitest';
vi.mock('@/services/api', () => ({ put: vi.fn() }));
import { put } from '@/services/api';
import { wrap } from './_fix/srv3';
const putMock = vi.mocked(put);
describe('with getApiErrorMessage', () => {
  it('rejected mapped caught', async () => {
    putMock.mockRejectedValue(new Error('API_ERROR:Reserve.HasActivePassengers'));
    const r = await wrap();
    expect(r).toEqual({ ok: false, code: 'Reserve.HasActivePassengers' });
  });
});
