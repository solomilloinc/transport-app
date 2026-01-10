import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/auth.config';

export async function POST(request: NextRequest) {
  try {
    // Obtener las cookies del request (incluye refreshToken HttpOnly)
    const cookieHeader = request.headers.get('cookie') || '';

    // Llamar al backend para renovar el token
    const response = await fetch(`${process.env.BACKEND_URL}/renew-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader, // Pasar las cookies al backend
      },
    });

    if (!response.ok) {
      // Si el refresh token es inválido o fue reusado
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Token refresh failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Crear la respuesta con el nuevo accessToken
    const nextResponse = NextResponse.json({
      token: data.token,
      success: true
    });

    // Propagar las cookies del backend (nuevo refreshToken) al cliente
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }

    return nextResponse;
  } catch (error) {
    console.error('Error renovando token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
