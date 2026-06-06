'use server';
import { put } from '@/services/api';
import { getApiErrorMessage } from '@/lib/apiErrors';
export async function wrap(): Promise<{ ok: boolean; code?: string }> {
  try { const ok = await put('/x', {}); return { ok }; }
  catch (e) { const info = getApiErrorMessage(e); return { ok: false, code: info.code ?? '' }; }
}
