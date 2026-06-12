'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { CurrentUserProfile } from '@/services/user-management';
import { normalizeRole } from '@/lib/auth-role';

interface MandatoryProfileDialogProps {
  profile?: CurrentUserProfile;
}

export function MandatoryProfileDialog({ profile: initialProfile }: MandatoryProfileDialogProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(initialProfile ?? null);
  const [form, setForm] = useState({
    firstName: initialProfile?.firstName ?? '',
    lastName: initialProfile?.lastName ?? '',
    documentNumber: initialProfile?.documentNumber ?? '',
    phone1: initialProfile?.phone1 ?? '',
    phone2: initialProfile?.phone2 ?? '',
  });

  const role = normalizeRole(session?.user?.role);
  const shouldGate =
    role === 'client' &&
    !!session?.user?.customerId &&
    !!session?.user?.needsProfileCompletion;

  useEffect(() => {
    if (!shouldGate || initialProfile) {
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/account/profile', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const nextProfile = (await response.json()) as CurrentUserProfile;
        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);
        setForm({
          firstName: nextProfile.firstName ?? '',
          lastName: nextProfile.lastName ?? '',
          documentNumber: nextProfile.documentNumber ?? '',
          phone1: nextProfile.phone1 ?? '',
          phone2: nextProfile.phone2 ?? '',
        });
      } catch {
        // Si falla la carga, mantenemos el gate visible cuando ya tenemos session flag.
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [shouldGate, initialProfile]);

  const isOpen = shouldGate && (profile?.needsProfileCompletion ?? true);
  const description = useMemo(
    () =>
      'Para continuar necesitamos registrar tu DNI y telefono. Hasta completar estos datos no podras reservar ni usar tu cuenta.',
    []
  );

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/account/profile', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { message?: string } | null;
          throw new Error(payload?.message || 'No se pudo actualizar el perfil.');
        }

        const updatedProfile = (await response.json()) as CurrentUserProfile;
        await update({
          user: {
            id: String(updatedProfile.userId),
            email: updatedProfile.email,
            role: updatedProfile.role,
            customerId: updatedProfile.customerId ?? null,
            needsProfileCompletion: updatedProfile.needsProfileCompletion,
          },
        });
        setProfile(updatedProfile);
        router.replace('/account/bookings');
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : 'No se pudo actualizar el perfil.');
      }
    });
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={() => {}}
      title="Completar perfil obligatorio"
      description={description}
      onSubmit={handleSubmit}
      submitText="Guardar datos"
      isLoading={isPending}
      className="lg:w-[42rem]"
      showCloseButton={false}
      preventClose
    >
      <FormField label="Nombre" required>
        <Input
          value={form.firstName}
          onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))}
          placeholder="Nombre"
        />
      </FormField>
      <FormField label="Apellido" required>
        <Input
          value={form.lastName}
          onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))}
          placeholder="Apellido"
        />
      </FormField>
      <FormField label="Numero de documento" required>
        <Input
          value={form.documentNumber}
          onChange={(e) => setForm((current) => ({ ...current, documentNumber: e.target.value }))}
          placeholder="DNI"
        />
      </FormField>
      <FormField label="Telefono" required>
        <Input
          value={form.phone1}
          onChange={(e) => setForm((current) => ({ ...current, phone1: e.target.value }))}
          placeholder="Telefono principal"
        />
      </FormField>
      <FormField label="Telefono alternativo">
        <Input
          value={form.phone2}
          onChange={(e) => setForm((current) => ({ ...current, phone2: e.target.value }))}
          placeholder="Telefono alternativo"
        />
      </FormField>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </FormDialog>
  );
}
