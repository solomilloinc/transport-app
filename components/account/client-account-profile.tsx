'use client';

import { useEffect, useState } from 'react';
import { ClientProfileForm } from '@/components/account/client-profile-form';
import { CurrentUserProfile } from '@/services/user-management';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ClientAccountProfile() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/account/profile', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { message?: string } | null;
          throw new Error(payload?.message || 'No se pudo cargar el perfil.');
        }

        const nextProfile = (await response.json()) as CurrentUserProfile;
        if (isMounted) {
          setProfile(nextProfile);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el perfil.');
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return <ClientProfileForm profile={profile} />;
}
