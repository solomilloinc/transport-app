"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

/**
 * Componente interno que detecta errores de sesión y redirige al login
 */
function SessionErrorHandler({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Si hay un error de refresh token, cerrar sesión y redirigir
    if (session?.error === 'RefreshTokenError') {
      console.warn('Sesión expirada - redirigiendo al login');
      signOut({ callbackUrl: '/', redirect: true });
    }
  }, [session?.error]);

  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionErrorHandler>
        {children}
      </SessionErrorHandler>
    </SessionProvider>
  );
}
