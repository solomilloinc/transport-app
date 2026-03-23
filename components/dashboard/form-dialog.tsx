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
          'max-h-[90vh] w-[95%] max-w-none overflow-y-auto rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,rgba(253,253,250,0.98),rgba(242,244,238,0.95))] p-0 shadow-[0_30px_80px_rgba(16,24,18,0.16)] sm:w-[90%] md:w-[75%] lg:w-[50%]',
          className
        )}
      >
        <div className="space-y-6 p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-slate-900">{title}</DialogTitle>
            <DialogDescription className="text-slate-500">{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">{children}</div>
          <DialogFooter className="border-t border-black/6 pt-6">
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={isLoading || disabled}
              className="rounded-full bg-[linear-gradient(135deg,#182b1f,#35533f)] px-6 text-white hover:opacity-95"
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
