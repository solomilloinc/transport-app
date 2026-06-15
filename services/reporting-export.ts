'use client';

import { ReportingFamily } from '@/interfaces/reporting';
import { pruneEmpty } from '@/hooks/url-parsers';

interface ExportReportingArgs {
  family: ReportingFamily;
  filters: Record<string, any>;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Dispara el export xlsx contra el Route Handler (ver ADR 0005), descarga el
 * blob y lo guarda con el filename que mandó el backend (`Content-Disposition`).
 *
 * En error, el route reenvía `{ code }` + status; reconstruimos un
 * `Error('API_ERROR:<code>')` para que el caller use el copy de `lib/apiErrors.ts`.
 */
export async function exportReporting({
  family,
  filters,
  sortBy,
  sortDescending,
}: ExportReportingArgs): Promise<void> {
  const res = await fetch(`/api/reporting/${family}/export`, {
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
  const filename =
    parseFilename(res.headers.get('Content-Disposition')) ?? defaultFilename(family);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

function defaultFilename(family: ReportingFamily): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `reporte-${family === 'passengers' ? 'pasajeros' : 'reservas'}-${stamp}.xlsx`;
}
