import { NextRequest } from 'next/server';
import { handleReportingExport } from '@/lib/reporting/export-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  return handleReportingExport(req, '/cashbox/report/export');
}
