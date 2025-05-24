'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/login-modal';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
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
        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => signOut()}>
          Cerrar Sesion
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
