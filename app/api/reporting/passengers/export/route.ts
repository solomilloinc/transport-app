import { NextRequest } from 'next/server';
import { handleReportingExport } from '@/lib/reporting/export-handler';

// getServerAxios usa getServerSession + cookies() → runtime Node (no Edge).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  return handleReportingExport(req, '/reporting/passengers/export');
}
