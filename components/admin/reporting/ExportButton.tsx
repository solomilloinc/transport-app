'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { exportReport } from '@/services/reporting-export';

interface Props {
  /** Route Handler de export, ej. `/api/reporting/passengers/export` o `/api/cashbox/payments/export`. */
  endpoint: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortDescending?: boolean;
  disabled?: boolean;
}

export function ExportButton({ endpoint, filters, sortBy, sortDescending, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportReport({ endpoint, filters, sortBy, sortDescending });
    } catch (error) {
      toast({
        title: 'No se pudo exportar',
        description: getApiErrorMessage(error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={disabled || loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Exportar
    </Button>
  );
}
