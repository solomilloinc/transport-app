import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/auth.config';

export async function POST(request: NextRequest) {
  try {
    // Obtener la sesión para el accessToken
    const session = await getServerSession(nextAuthOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Obtener las cookies del request
    const cookieHeader = request.headers.get('cookie') || '';

    // Llamar al backend para revocar todas las sesiones
    const response = await fetch(`${process.env.BACKEND_URL}/revoke-all-sessions`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to revoke sessions' },
        { status: response.status }
      );
    }

    // Crear respuesta
    const nextResponse = NextResponse.json({
      success: true,
      message: 'All sessions revoked successfully'
    });

    // Propagar las cookies del backend
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error('Error revocando sesiones:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
