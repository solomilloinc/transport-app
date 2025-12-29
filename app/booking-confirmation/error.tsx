'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/navbar';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BookingConfirmationError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Booking confirmation error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-yellow-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-yellow-500 mb-4">
                <AlertTriangle className="mx-auto h-16 w-16" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Error al cargar la confirmación
              </h1>
              
              <p className="text-gray-600 mb-6">
                Hubo un problema al mostrar los detalles de tu reserva. 
                Si completaste el pago correctamente, tu reserva sigue siendo válida.
                Revisa tu correo electrónico para ver la confirmación.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-3 bg-yellow-50 rounded-lg text-left">
                  <p className="text-xs font-mono text-yellow-700 break-all">
                    {error.message}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={reset}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar página
                </Button>
                
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Volver al inicio
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                Si tienes dudas sobre tu reserva, por favor contacta a soporte.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
