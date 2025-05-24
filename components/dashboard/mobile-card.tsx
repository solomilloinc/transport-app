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
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function MobileCard({ title, subtitle, fields, badge, onEdit, onDelete, editLabel = 'Editar', deleteLabel = 'Eliminar' }: MobileCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {badge && badge}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map((field, index) => (
            <div key={index}>
              <p className="text-gray-700 font-medium">{field.label}:</p>
              <p className="font-medium">{field.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
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
      </CardFooter>
    </Card>
  );
}
