import { NextRequest } from 'next/server';
import { AxiosError } from 'axios';
import { getServerAxios } from '@/services/axios';

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Handler compartido del export binario de la Reportería (ver ADR 0005).
 *
 * Reusa `getServerAxios` (mismo carril de auth/tenant/refresh que los Server
 * Actions, pero acá podemos hacer passthrough de los headers HTTP). Trae el
 * xlsx como `arraybuffer` y reenvía `Content-Type` + `Content-Disposition` tal
 * cual, para que el browser nombre el archivo solo.
 *
 * En error, decodifica el cuerpo del backend (que vino como binario) y reenvía
 * `{ code }` + el status original, para que el cliente muestre el copy del
 * catálogo (`lib/apiErrors.ts`).
 */
export async function handleReportingExport(
  req: NextRequest,
  backendPath: string
): Promise<Response> {
  let body: { filters?: unknown; sortBy?: unknown; sortDescending?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // body vacío → el backend validará y devolverá 422 (rango requerido)
  }

  const payload = {
    filters: body?.filters ?? {},
    sortBy: body?.sortBy ?? null,
    sortDescending: body?.sortDescending ?? true,
  };

  try {
    const axios = await getServerAxios();
    const resp = await axios.post(backendPath, payload, { responseType: 'arraybuffer' });

    const headers = new Headers();
    headers.set('Content-Type', String(resp.headers['content-type'] ?? XLSX_CONTENT_TYPE));
    const cd = resp.headers['content-disposition'];
    if (cd) headers.set('Content-Disposition', String(cd));
    headers.set('Cache-Control', 'no-store');

    return new Response(resp.data, { status: 200, headers });
  } catch (error) {
    return exportErrorResponse(error);
  }
}

function exportErrorResponse(error: unknown): Response {
  let status = 500;
  let code = '';

  if (error instanceof AxiosError) {
    status = error.response?.status ?? 500;
    code = extractCodeFromBinary(error.response?.data) ?? '';
  }

  return new Response(JSON.stringify({ code }), {
    status: status >= 400 && status < 600 ? status : 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * El error del backend viaja como binario (pedimos `arraybuffer`). Lo decodificamos
 * a texto, parseamos JSON y extraemos el código con la misma estrategia que
 * `services/api.ts` (ProblemDetails `title` sin espacios / `code` / `error.code`).
 */
function extractCodeFromBinary(data: unknown): string | null {
  if (!data) return null;
  try {
    const text =
      typeof data === 'string'
        ? data
        : Buffer.from(data as ArrayBuffer).toString('utf8');
    const json = JSON.parse(text);
    if (typeof json.code === 'string' && json.code) return json.code;
    if (json.error && typeof json.error.code === 'string' && json.error.code) {
      return json.error.code;
    }
    if (typeof json.title === 'string' && json.title && !/\s/.test(json.title)) {
      return json.title;
    }
  } catch {
    return null;
  }
  return null;
}
