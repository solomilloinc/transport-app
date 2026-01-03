'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="mx-auto h-16 w-16" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Error Crítico
            </h1>
            
            <p className="text-gray-600 mb-6">
              Ha ocurrido un error grave en la aplicación. Por favor, recarga 
              la página para continuar.
            </p>

            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar aplicación
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
