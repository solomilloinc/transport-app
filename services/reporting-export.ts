'use client';

interface ExportReportArgs {
  /** Route Handler de export, ej. `/api/reporting/passengers/export`. */
  endpoint: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Dispara un export xlsx contra un Route Handler (ver ADR 0005), descarga el
 * blob y lo guarda con el filename que mandó el backend (`Content-Disposition`).
 * Genérico: lo usan tanto la Reportería como Cobranza.
 *
 * En error, el route reenvía `{ code }` + status; reconstruimos un
 * `Error('API_ERROR:<code>')` para que el caller use el copy de `lib/apiErrors.ts`.
 */
export async function exportReport({
  endpoint,
  filters,
  sortBy,
  sortDescending,
}: ExportReportArgs): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters: pruneEmpty(filters), sortBy, sortDescending }),
  });

  if (!res.ok) {
    let code = '';
    try {
      const data = await res.json();
      if (typeof data?.code === 'string') code = data.code;
    } catch {
      // sin cuerpo parseable
    }
    throw new Error(code ? `API_ERROR:${code}` : 'API_ERROR:Reporting.ExportFailed');
  }

  const blob = await res.blob();
  const filename = parseFilename(res.headers.get('Content-Disposition')) ?? defaultFilename(endpoint);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Quita claves vacías para no mandar `search:''` y dejar que el backend aplique defaults. */
function pruneEmpty(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const empty =
      v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (!empty) out[k] = v;
  }
  return out;
}

/** Extrae filename de `attachment; filename="..."` (soporta filename*=UTF-8''...). */
function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(contentDisposition);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/"/g, '').trim());
    } catch {
      /* noop */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return plain?.[1]?.trim() ?? null;
}

function defaultFilename(endpoint: string): string {
  const segs = endpoint.split('/').filter(Boolean);
  const name = segs[segs.length - 2] ?? 'reporte';
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `reporte-${name}-${stamp}.xlsx`;
}
