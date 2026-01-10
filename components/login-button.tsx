'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/login-modal';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logoutFromBackend } from '@/services/auth-client';

export default function LoginButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Primero revocar el refresh token en el backend
      await logoutFromBackend();
      // Luego cerrar la sesión de NextAuth
      await signOut({ callbackUrl: '/', redirect: true });
    } catch (error) {
      console.error('Error durante logout:', error);
      // Aún así intentar cerrar la sesión local
      await signOut({ callbackUrl: '/', redirect: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (session) {
    return (
      <>
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
          onClick={() => router.push('/admin/services')}
        >
          Mi cuenta
        </Button>
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesion'}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="border-blue-600 text-blue-600 hover:bg-blue-50"
        onClick={() => setIsModalOpen(true)}
      >
        Log In
      </Button>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
