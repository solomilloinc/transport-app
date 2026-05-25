import { post } from './api';

/**
 * Dispara el batch `GenerateFutureReservesFunction` manualmente.
 *
 * Endpoint: POST /GenerateFutureReservesFunction  (Admin / SuperAdmin)
 *
 * ⚠️ **No usar después de crear una FrequentSubscription**. Desde Mayo 2026
 * `POST /api/frequent-subscription-create` ya aplica la sub a las Reserves
 * existentes en el mismo request — los Passengers quedan creados de forma
 * atómica. Disparar el batch acá es innecesario y caro (re-procesa todos
 * los tenants y todas las subs).
 *
 * Casos donde **sí** corresponde llamarlo:
 *  - Acción manual de admin tipo "refrescar todo" si se detectan inconsistencias.
 *  - Job scheduled nocturno (lo invoca el backend, no el frontend).
 *
 * Hoy no hay UI que lo invoque, pero dejamos el wrapper listo para cuando
 * se agregue esa acción manual en una pantalla de operaciones.
 */
export async function generateFutureReserves(): Promise<void> {
  await post('/GenerateFutureReservesFunction', {});
}
