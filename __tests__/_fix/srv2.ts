'use server';
import { put } from '@/services/api';
export async function wrap(): Promise<{ ok: boolean; caught?: boolean }> {
  try { const ok = await put('/x', {}); return { ok }; }
  catch { return { ok: false, caught: true }; }
}
