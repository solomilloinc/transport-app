import { NextRequest, NextResponse } from 'next/server';
import { fetchAccountBackend, fetchBackendWithSession } from '@/app/api/account/_lib/backend-auth';
import { ClientProfileCompleteRequest, CurrentUserProfile } from '@/services/user-management';

export async function GET(request: NextRequest) {
  try {
    const profile = await fetchAccountBackend<CurrentUserProfile>(request, '/me');
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cargar el perfil.';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ClientProfileCompleteRequest;
    const profile = await fetchBackendWithSession<CurrentUserProfile>(request, '/client-profile-complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el perfil.';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
