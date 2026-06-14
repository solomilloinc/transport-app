'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/dashboard/form-field';
import { CurrentUserProfile } from '@/services/user-management';

interface ClientProfileFormProps {
  profile: CurrentUserProfile;
}

export function ClientProfileForm({ profile }: ClientProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    documentNumber: profile.documentNumber ?? '',
    phone1: profile.phone1 ?? '',
    phone2: profile.phone2 ?? '',
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : 'No se pudo actualizar el perfil.');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-blue-500">Datos personales</CardTitle>
        <p className="text-sm text-muted-foreground">
          Mantiene tus datos actualizados para agilizar futuras reservas y pagos.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
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
          <FormField label="Telefono alternativo" className="md:col-span-2">
            <Input
              value={form.phone2}
              onChange={(e) => setForm((current) => ({ ...current, phone2: e.target.value }))}
              placeholder="Telefono alternativo"
            />
          </FormField>

          <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="font-medium text-slate-900">{profile.email}</div>
            <div>Rol: {profile.role}</div>
          </div>

          {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
