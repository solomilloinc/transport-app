import { OperativeUsersManager } from '@/components/admin/operative-users-manager';
import { getOperativeUsers } from '@/services/user-management';

export default async function AdminUsersPage() {
  const response = await getOperativeUsers({
    pageNumber: 1,
    pageSize: 100,
    sortBy: 'createddate',
    sortDescending: true,
    filters: {},
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Usuarios operativos</h1>
        <p className="mt-2 text-sm text-slate-600">
          Alta y administración básica de usuarios con acceso a reservas y clientes.
        </p>
      </div>

      <OperativeUsersManager users={response.items} />
    </div>
  );
}
