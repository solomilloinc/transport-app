'use server';
export async function wrap(dep: () => Promise<boolean>) {
  try { const ok = await dep(); return { ok }; }
  catch { return { ok: false, caught: true }; }
}
