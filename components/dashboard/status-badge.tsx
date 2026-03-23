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
        return 'border border-emerald-200/80 bg-emerald-50 text-emerald-800';
      case 'Pendiente':
      case 'Mantenimiento':
        return 'border border-amber-200/80 bg-amber-50 text-amber-800';
      case 'Cancelada':
      case 'Inactive':
        return 'border border-red-200/80 bg-red-50 text-red-800';
      default:
        return 'border border-slate-200/80 bg-slate-100 text-slate-700';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
        getStatusStyles(status),
        className
      )}
    >
      {status}
    </span>
  );
}
