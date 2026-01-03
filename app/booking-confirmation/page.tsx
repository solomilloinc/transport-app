"use client";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Download,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCheckout } from "@/contexts/CheckoutContext";

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const { clearCheckout } = useCheckout();
  const status = searchParams.get("status");
  const success = searchParams.get("success") === "true";
  const reserveId = searchParams.get("reserveId");
  const isApproved = success || status === "approved";

  useEffect(() => {
    if (isApproved) {
      clearCheckout();
    }
  }, [isApproved, clearCheckout]);

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <XCircle className="mx-auto h-16 w-16" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago Fallido
            </h1>
            <p className="text-gray-600 mb-6">
              Hubo un problema al procesar tu pago. Por favor, inténtalo de nuevo o
              contacta a soporte. El estado de la transacción es: <span className="font-semibold">{status || 'desconocido'}</span>.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <Button
              variant="link"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 p-0"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver al Inicio
            </Button>
          </Link>

          <Card className="border-green-100 shadow-lg overflow-hidden">
            <div className="bg-green-50 p-6 border-b border-green-100 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl md:text-3xl font-bold text-green-800 font-display">
                ¡Reserva Confirmada!
              </h1>
              <p className="text-green-700 mt-2">
                Tu viaje ha sido reservado con éxito. Hemos enviado un correo
                de confirmación con todos los detalles.
              </p>
            </div>
            <CardContent className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">
                      Referencia de la Reserva
                    </div>
                    <div className="text-xl font-bold text-blue-800">
                      ID-{reserveId || 'N/A'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Ticket
                  </Button>
                </div>
              </div>

              <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">
                    Información Importante
                  </h2>
                  <div className="bg-yellow-50 p-4 rounded-lg text-sm space-y-2 text-yellow-800">
                    <p>
                      <span className="font-medium">Check-in:</span> Por favor,
                      llegue al menos 15 minutos antes de la salida.
                    </p>
                    <p>
                      <span className="font-medium">Equipaje:</span> Cada
                      pasajero puede llevar una pieza de equipaje (máx. 20 kg) y
                      un artículo de mano.
                    </p>
                  </div>
                </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              ¿Necesitas Ayuda?
            </h2>
            <p className="text-gray-600 mb-4">
              Nuestro equipo de atención al cliente está disponible para ayudarte.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link href="/">
                <Button variant="outline" className="border-blue-200">
                  Reservar Otro Viaje
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}