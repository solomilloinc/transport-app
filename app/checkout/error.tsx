'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CheckoutError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Checkout error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-orange-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-orange-500 mb-4">
                <AlertTriangle className="mx-auto h-16 w-16" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Error en el Checkout
              </h1>
              
              <p className="text-gray-600 mb-6">
                Hubo un problema al procesar tu reserva. Por favor, intenta 
                nuevamente. Si el problema persiste, vuelve a buscar tu viaje.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-3 bg-orange-50 rounded-lg text-left">
                  <p className="text-xs font-mono text-orange-700 break-all">
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
                  Reintentar checkout
                </Button>
                
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Buscar otro viaje
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                No se ha realizado ningún cargo a tu tarjeta.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
