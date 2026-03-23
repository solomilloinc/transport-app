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
    <Card className="overflow-hidden rounded-[1.75rem] border border-black/6 bg-white/82 shadow-[0_18px_42px_rgba(22,34,24,0.08)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg text-slate-900">{title}</CardTitle>
            {subtitle && <CardDescription className="mt-1 text-slate-500">{subtitle}</CardDescription>}
          </div>
          {badge && badge}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {fields.map((field, index) => (
            <div key={index} className="rounded-2xl border border-black/5 bg-[#f5f6f1] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{field.label}</p>
              <p className="mt-1 font-medium text-slate-900">{field.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-black/6 bg-white/65 pt-4">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="rounded-full border-black/8 bg-white/80 px-4 text-slate-700">
            {editLabel}
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="sm" className="rounded-full border-red-200 bg-red-50 px-4 text-red-600" onClick={onDelete}>
            {deleteLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
