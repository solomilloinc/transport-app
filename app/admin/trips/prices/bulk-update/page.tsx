'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { put } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function BulkUpdatePrices() {
  const router = useRouter();

  const [idaPercentage, setIdaPercentage] = useState<string>('');
  const [idaVueltaPercentage, setIdaVueltaPercentage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!idaPercentage && !idaVueltaPercentage) {
      toast({
        title: 'Error',
        description: 'Debe ingresar al menos un porcentaje de actualización.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const priceUpdates = [];

      if (idaPercentage) {
        priceUpdates.push({
          reserveTypeId: 1,
          percentage: Number(idaPercentage),
        });
      }

      if (idaVueltaPercentage) {
        priceUpdates.push({
          reserveTypeId: 2,
          percentage: Number(idaVueltaPercentage),
        });
      }

      const response = await put('/trip-prices-update-percentage', { priceUpdates });
      if (response) {
        toast({
          title: 'Precios actualizados',
          description: 'Los precios han sido actualizados exitosamente.',
          variant: 'success',
        });
        router.push('/admin/trips');
      } else {
        toast({
          title: 'Error',
          description: 'Error al actualizar los precios.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al actualizar los precios.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateExample = (basePrice: number, percentage: string) => {
    if (!percentage) return basePrice;
    const pct = Number(percentage);
    return basePrice + (basePrice * pct) / 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/trips')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <PageHeader
        title="Actualización Masiva de Precios"
        description="Actualiza todos los precios de rutas activas según un porcentaje."
      />

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Advertencia</AlertTitle>
        <AlertDescription>
          Esta acción actualizará TODOS los precios activos de todas las rutas según el porcentaje indicado. Esta operación no se puede deshacer.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Porcentajes</CardTitle>
          <CardDescription>
            Ingrese el porcentaje de aumento (positivo) o descuento (negativo) para cada tipo de reserva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ida-percentage">Ida (%)</Label>
              <div className="relative">
                <Input
                  id="ida-percentage"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 10.5"
                  value={idaPercentage}
                  onChange={(e) => setIdaPercentage(e.target.value)}
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {idaPercentage && (
                <p className="text-sm text-muted-foreground">
                  Ejemplo: $15,000 → ${calculateExample(15000, idaPercentage).toLocaleString('es-AR')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ida-vuelta-percentage">Ida y Vuelta (%)</Label>
              <div className="relative">
                <Input
                  id="ida-vuelta-percentage"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 8.0"
                  value={idaVueltaPercentage}
                  onChange={(e) => setIdaVueltaPercentage(e.target.value)}
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {idaVueltaPercentage && (
                <p className="text-sm text-muted-foreground">
                  Ejemplo: $28,000 → ${calculateExample(28000, idaVueltaPercentage).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Utilice valores negativos para aplicar descuentos (ej: -5% reducirá los precios en un 5%).
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/trips')}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Aplicando...' : 'Aplicar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
