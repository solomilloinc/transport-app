'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { exportReporting } from '@/services/reporting-export';
import { ReportingFamily } from '@/interfaces/reporting';

interface Props {
  family: ReportingFamily;
  filters: Record<string, any>;
  sortBy?: string;
  sortDescending?: boolean;
  disabled?: boolean;
}

export function ExportButton({ family, filters, sortBy, sortDescending, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportReporting({ family, filters, sortBy, sortDescending });
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
