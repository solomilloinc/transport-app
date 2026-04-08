/**
 * Espejo de `Transport.SharedKernel.EntityStatusEnum` del backend.
 */
export enum EntityStatus {
  Active = 1,
  Inactive = 2,
  Deleted = 3,
  Suspended = 4,
}

export const ENTITY_STATUS_VALUES = [
  EntityStatus.Active,
  EntityStatus.Inactive,
  EntityStatus.Deleted,
  EntityStatus.Suspended,
] as const;

export const ENTITY_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: String(EntityStatus.Active), label: 'Activo' },
  { value: String(EntityStatus.Inactive), label: 'Inactivo' },
  { value: String(EntityStatus.Suspended), label: 'Suspendido' },
];
