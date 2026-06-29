'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface MobileCardField {
  label: string;
  value: ReactNode;
}

interface MobileCardProps {
  title: string;
  subtitle?: string;
  fields: MobileCardField[];
  badge?: ReactNode;
  actions?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function MobileCard({
  title,
  subtitle,
  fields,
  badge,
  actions,
  onEdit,
  onDelete,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
}: MobileCardProps) {
  const hasFooter = actions || onEdit || onDelete;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {badge && badge}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map((field, index) => (
            <div key={index} className="min-w-0">
              <p className="text-gray-700 font-medium">{field.label}:</p>
              <div className="font-medium break-words">{field.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
      {hasFooter && (
        <CardFooter className="flex flex-wrap justify-between gap-2 pt-2">
          {actions || (
            <>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  {editLabel}
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" className="text-red-600" onClick={onDelete}>
                  {deleteLabel}
                </Button>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
