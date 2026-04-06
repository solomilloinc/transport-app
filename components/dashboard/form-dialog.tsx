'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  onSubmit: () => void;
  submitText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitText = 'Guardar',
  isLoading = false,
  disabled = false,
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] w-[95%] max-w-none overflow-y-auto rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,249,255,0.97))] p-0 shadow-[0_34px_90px_rgba(15,23,42,0.16)] sm:w-[90%] md:w-[75%] lg:w-[50%]',
          className
        )}
      >
        <div className="space-y-6 p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-slate-900">{title}</DialogTitle>
            <DialogDescription className="text-slate-500">{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">{children}</div>
          <DialogFooter className="border-t border-sky-100/90 pt-6">
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={isLoading || disabled}
              className="rounded-full bg-blue-600 px-6 text-white shadow-sm hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
