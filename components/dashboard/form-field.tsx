import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { FormError } from '../form-error';

interface FormFieldProps {
  label?: string;
  children: ReactNode;
  className?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export function FormField({ label, children, className, error, required = false, description }: FormFieldProps) {
  return (
    <div className={cn('space-y-2 w-full', className)}>
      {label && (
        <Label htmlFor={label.toLowerCase()} className={cn('text-gray-700', error && 'text-red-500')}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {description && <span className="text-xs text-gray-500">{description}</span>}
      <div className="w-full">{children}</div>
      <FormError message={error} />
    </div>
  );
}
