import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/auth.config';

export async function POST(request: NextRequest) {
  try {
    // Obtener la sesión para el accessToken (necesario para el header Authorization)
    const session = await getServerSession(nextAuthOptions);

    // Obtener las cookies del request (incluye refreshToken HttpOnly)
    const cookieHeader = request.headers.get('cookie') || '';

    // Llamar al backend para revocar el refresh token
    const response = await fetch(`${process.env.BACKEND_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        ...(session?.accessToken && {
          'Authorization': `Bearer ${session.accessToken}`
        }),
      },
    });

    // Crear respuesta limpiando la cookie de refresh token
    const nextResponse = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

    // Propagar las cookies del backend (para limpiar el refreshToken)
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
