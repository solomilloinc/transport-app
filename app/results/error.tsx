'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ResultsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Results error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-12">
        <div className="max-w-lg mx-auto">
          <Card className="border-blue-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-blue-500 mb-4">
                <AlertTriangle className="mx-auto h-16 w-16" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                No pudimos cargar los resultados
              </h1>
              
              <p className="text-gray-600 mb-6">
                Hubo un problema al buscar los viajes disponibles. Esto puede 
                deberse a un problema temporal. Por favor, intenta nuevamente.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg text-left">
                  <p className="text-xs font-mono text-blue-700 break-all">
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
                  Buscar nuevamente
                </Button>
                
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Nueva búsqueda
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
