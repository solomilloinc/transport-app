'use server';

import { createOperativeUser, updateOperativeUser } from '@/services/user-management';
import { deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

/**
 * Devuelven el error como VALOR (`runServerAction`) en vez de relanzarlo: un
 * throw no capturado en un Server Action se enmascara en producción (ver
 * `lib/apiErrors.ts` → `ActionResult`). Antes este archivo ya era `'use server'`
 * pero dejaba que el error de `createOperativeUser`/`updateOperativeUser`
 * cruzara sin capturar — mismo bug, en prod el usuario veía el mensaje genérico.
 */
export async function createOperativeUserAction(
  payload: { email: string; password: string },
): Promise<ActionResult<number>> {
  return runServerAction(() =>
    createOperativeUser({
      email: payload.email,
      password: payload.password,
      role: 'Operator',
    }),
  );
}

export async function updateOperativeUserAction(
  payload: { userId: number; email: string; status: number },
): Promise<ActionResult<boolean>> {
  return runServerAction(() =>
    updateOperativeUser(payload.userId, {
      email: payload.email,
      role: 'Operator',
      status: payload.status,
    }),
  );
}

export async function deleteOperativeUserAction(userId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/operative-user-delete/${userId}`));
}
