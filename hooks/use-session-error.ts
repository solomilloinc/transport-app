'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';

export function useSessionError() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.error === 'RefreshTokenError') {
      signOut({ callbackUrl: '/', redirect: true });
    }
  }, [session?.error]);

  return {
    session,
    status,
    isAuthenticated: status === 'authenticated' && !session?.error,
    isLoading: status === 'loading',
    hasError: !!session?.error,
  };
}
