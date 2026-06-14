'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { OperativeUserItem } from '@/services/user-management';
import { createOperativeUserAction, updateOperativeUserAction } from '@/app/admin/users/actions';

interface OperativeUsersManagerProps {
  users: OperativeUserItem[];
}

export function OperativeUsersManager({ users }: OperativeUsersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '' });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createOperativeUserAction(newUser);
        setNewUser({ email: '', password: '' });
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : 'No se pudo crear el usuario.');
      }
    });
  };

  const toggleStatus = (user: OperativeUserItem) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateOperativeUserAction({
          userId: user.userId,
          email: user.email,
          status: user.status === 1 ? 2 : 1,
        });
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : 'No se pudo actualizar el usuario.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="operativo@empresa.com"
          value={newUser.email}
          onChange={(e) => setNewUser((current) => ({ ...current, email: e.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Contraseña segura"
          type="password"
          value={newUser.password}
          onChange={(e) => setNewUser((current) => ({ ...current, password: e.target.value }))}
          required
        />
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          disabled={isPending}
        >
          Crear operativo
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4">
        {users.map((user) => (
          <article key={user.userId} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{user.email}</h2>
              <p className="text-sm text-slate-500">Rol operativo</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {user.status === 1 ? 'Activo' : 'Inactivo'}
              </span>
              <button
                type="button"
                onClick={() => toggleStatus(user)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                disabled={isPending}
              >
                {user.status === 1 ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
