'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-red-100 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="mx-auto h-16 w-16" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Algo salió mal!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Ha ocurrido un error inesperado. Por favor, intenta nuevamente o 
            vuelve al inicio.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 bg-red-50 rounded-lg text-left">
              <p className="text-xs font-mono text-red-700 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-500 mt-1">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
            
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
