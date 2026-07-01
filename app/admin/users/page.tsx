'use client';

import { useState } from 'react';
import { Edit, Trash, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/dashboard/page-header';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { StatusFilter } from '@/components/dashboard/status-filter';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';
import { MobileCard } from '@/components/dashboard/mobile-card';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { DeleteDialog } from '@/components/dashboard/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useFormValidation } from '@/hooks/use-form-validation';
import {
  validationConfigOperativeUserCreate,
  validationConfigOperativeUserEdit,
} from '@/validations/operativeUserSchema';
import { bindErrorInfoToForm } from '@/lib/apiErrors';
import { useReportFilters } from '@/hooks/use-report-filters';
import { getOperativeUserReport, OperativeUserItem } from '@/services/user-management';
import {
  createOperativeUserAction,
  updateOperativeUserAction,
  deleteOperativeUserAction,
} from '@/app/admin/users/actions';
import {
  OperativeUserReportFilters,
  emptyOperativeUserReportFilters,
} from '@/interfaces/filters/operative-user-filters';
import { ENTITY_STATUS_OPTIONS, EntityStatus } from '@/interfaces/filters/common';
import { enumParser, stringParser } from '@/hooks/url-parsers';

const operativeUserFilterParsers = {
  email: stringParser,
  status: enumParser<EntityStatus>([
    EntityStatus.Active,
    EntityStatus.Inactive,
    EntityStatus.Suspended,
  ]),
};

export default function OperativeUsersManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const addForm = useFormValidation(
    { email: '', password: '' },
    validationConfigOperativeUserCreate
  );
  const editForm = useFormValidation({ email: '' }, validationConfigOperativeUserEdit);

  const {
    draft,
    setDraftField,
    apply,
    reset,
    refetch,
    pageNumber,
    setPageNumber,
    data,
    loading,
  } = useReportFilters<OperativeUserReportFilters, OperativeUserItem>({
    defaults: emptyOperativeUserReportFilters,
    parsers: operativeUserFilterParsers,
    apiCall: getOperativeUserReport,
    initialSortBy: 'createddate',
  });

  const submitAddUser = async () => {
    addForm.handleSubmit(async (formData) => {
      const result = await createOperativeUserAction({
        email: formData.email,
        password: formData.password,
      });
      if (!result.ok) {
        bindErrorInfoToForm(result, addForm.setError);
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Usuario creado',
        description: 'El usuario operativo ha sido creado exitosamente',
        variant: 'success',
      });
      setIsAddModalOpen(false);
      addForm.resetForm();
      refetch();
    });
  };

  const submitEditUser = async () => {
    editForm.handleSubmit(async (formData) => {
      if (currentUserId == null) return;
      const result = await updateOperativeUserAction({
        userId: currentUserId,
        email: formData.email,
        status: EntityStatus.Active,
      });
      if (!result.ok) {
        bindErrorInfoToForm(result, editForm.setError);
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Usuario actualizado',
        description: 'El usuario operativo ha sido actualizado exitosamente',
        variant: 'success',
      });
      setIsEditModalOpen(false);
      refetch();
    });
  };

  const handleEditUser = (user: OperativeUserItem) => {
    setCurrentUserId(user.userId);
    editForm.setField('email', user.email);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (id: number) => {
    setCurrentUserId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (currentUserId == null) return;
    const result = await deleteOperativeUserAction(currentUserId);
    if (!result.ok) {
      toast({ title: 'No se pudo eliminar', description: result.message, variant: 'destructive' });
      return;
    }
    setIsDeleteModalOpen(false);
    setCurrentUserId(null);
    refetch();
  };

  const columns = [
    { header: 'Email', accessor: 'email', width: '50%' },
    {
      header: 'Rol',
      accessor: 'role',
      width: '35%',
      cell: () => <span className="text-slate-600">Operativo</span>,
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      className: 'text-right',
      width: '15%',
      cell: (user: OperativeUserItem) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => handleEditUser(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => handleDeleteUser(user.userId)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios operativos"
        description="Alta y administración de usuarios con acceso a reservas y clientes."
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        }
      />

      <Card className="w-full">
        <CardContent className="pt-6 w-full">
          <div className="space-y-4 w-full">
            <FilterBar onReset={reset} onApply={apply} labels={['Email', 'Estado']}>
              <Input
                className="w-full sm:w-[220px]"
                placeholder="Email"
                value={draft.email ?? ''}
                onChange={(e) => setDraftField('email', e.target.value)}
              />
              <StatusFilter
                value={draft.status != null ? String(draft.status) : ''}
                onChange={(v) =>
                  setDraftField('status', v ? (Number(v) as EntityStatus) : undefined)
                }
                options={ENTITY_STATUS_OPTIONS}
              />
            </FilterBar>

            <div className="hidden md:block w-full">
              <DashboardTable
                columns={columns}
                data={data?.items ?? []}
                emptyMessage="No se encontraron usuarios operativos."
                isLoading={loading}
                skeletonRows={data?.pageSize}
              />
            </div>

            {data?.items?.length > 0 && (
              <TablePagination
                currentPage={pageNumber}
                totalPages={data?.totalPages}
                totalItems={data?.totalRecords}
                itemsPerPage={data?.pageSize}
                onPageChange={setPageNumber}
                itemName="usuarios"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile view - Card layout */}
      <div className="md:hidden space-y-4 mt-4">
        {loading && (data?.items?.length ?? 0) === 0 ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-card-${index}`} className="w-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, fieldIndex) => (
                    <div key={`skeleton-field-${fieldIndex}`}>
                      <Skeleton className="h-4 w-[80px] mb-1" />
                      <Skeleton className="h-5 w-[120px]" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (data?.items?.length ?? 0) > 0 ? (
          data?.items?.map((user) => (
            <MobileCard
              key={user.userId}
              title={user.email}
              subtitle="Usuario operativo"
              fields={[
                { label: 'Email', value: user.email },
                { label: 'Rol', value: 'Operativo' },
              ]}
              onEdit={() => handleEditUser(user)}
              onDelete={() => handleDeleteUser(user.userId)}
            />
          ))
        ) : (
          <div className="text-center p-4 border rounded-md">
            No se encontraron usuarios operativos.
          </div>
        )}
      </div>

      {/* Add Modal */}
      <FormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Agregar usuario operativo"
        description="Crea un nuevo usuario operativo completando el formulario a continuación."
        onSubmit={() => submitAddUser()}
        submitText="Crear usuario"
      >
        <FormField label="Email" required error={addForm.errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="operativo@empresa.com"
            value={addForm.data.email}
            onChange={(e) => addForm.setField('email', e.target.value)}
          />
        </FormField>
        <FormField label="Contraseña" required error={addForm.errors.password}>
          <Input
            id="password"
            type="password"
            placeholder="Contraseña segura"
            value={addForm.data.password}
            onChange={(e) => addForm.setField('password', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Edit Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar usuario operativo"
        description="Realiza cambios en los datos del usuario a continuación."
        onSubmit={() => submitEditUser()}
        submitText="Guardar Cambios"
      >
        <FormField label="Email" required error={editForm.errors.email}>
          <Input
            id="edit-email"
            type="email"
            value={editForm.data.email}
            onChange={(e) => editForm.setField('email', e.target.value)}
          />
        </FormField>
      </FormDialog>

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        description="Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario operativo y todos los datos asociados de nuestros servidores."
      />
    </div>
  );
}
