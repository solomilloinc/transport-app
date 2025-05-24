import { cn } from '@/lib/utils';

type StatusType = 'Confirmada' | 'Pendiente' | 'Cancelada' | 'Activo' | 'Inactivo' | 'Mantenimiento';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Confirmada':
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
      case 'Mantenimiento':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada':
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getStatusStyles(status), className)}>{status}</span>;
}
