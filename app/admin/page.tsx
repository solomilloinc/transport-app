'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Always redirect to reserves if we reach this page
    // The middleware ensures we're authenticated
    router.replace('/admin/reserves');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo a panel de administración...</p>
      </div>
    </div>
  );
}