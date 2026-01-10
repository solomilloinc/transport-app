'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook que detecta errores de sesión (como RefreshTokenError)
 * y redirige automáticamente al login cuando el token no puede renovarse.
 *
 * Usar en componentes que requieren autenticación o en el layout principal.
 */
export function useSessionError() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si hay un error de refresh token, cerrar sesión y redirigir
    if (session?.error === 'RefreshTokenError') {
      console.warn('Sesión expirada - redirigiendo al login');
      signOut({ callbackUrl: '/login', redirect: true });
    }
  }, [session?.error, router]);

  return {
    session,
    status,
    isAuthenticated: status === 'authenticated' && !session?.error,
    isLoading: status === 'loading',
    hasError: !!session?.error,
  };
}
