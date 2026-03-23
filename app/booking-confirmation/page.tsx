"use client";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Download, ChevronLeft, Clock3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useEffect } from "react";

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const success = searchParams.get("success") === "true";
  const reserveId = searchParams.get("reserveId");
  const isConfirmed = success && !!reserveId;
  const isPendingVerification =
    !isConfirmed && (status === "approved" || status === "pending" || status === "in_process");
  const { clearCheckout } = useCheckout();

  useEffect(() => {
    if (isConfirmed) {
      clearCheckout();
    }
  }, [isConfirmed, clearCheckout]);

  if (isPendingVerification) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-12">
          <div className="mx-auto max-w-4xl">
            <Card className="glass-panel overflow-hidden rounded-[2rem] border-0">
              <div className="border-b border-black/5 bg-[linear-gradient(135deg,rgba(250,204,21,0.22),rgba(255,255,255,0.55))] p-8 text-center">
                <Clock3 className="mx-auto mb-4 h-16 w-16 text-amber-600" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">estado del pago</p>
                <h1 className="mt-3 text-3xl text-slate-900 font-display md:text-4xl">
                  Pago recibido, reserva en validacion
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                  Estamos terminando de validar tu pago. La confirmacion final puede demorar unos instantes
                  segun el medio elegido.
                </p>
              </div>
              <CardContent className="p-8">
                <div className="rounded-[1.25rem] border border-black/5 bg-white/80 p-5 text-sm text-slate-700">
                  Estado informado por Mercado Pago: <span className="font-semibold text-slate-900">{status || 'pendiente'}</span>.
                </div>
                <div className="mt-6 flex flex-col gap-3 md:flex-row">
                  <Link href="/" className="w-full">
                    <Button className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#12353d,#255d6a)] text-white hover:opacity-95">
                      Volver al inicio
                    </Button>
                  </Link>
                  <Link href="/checkout" className="w-full">
                    <Button variant="outline" className="h-12 w-full rounded-full">
                      Volver al checkout
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!isConfirmed) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-12">
          <div className="mx-auto max-w-3xl">
            <Card className="glass-panel overflow-hidden rounded-[2rem] border-0">
              <div className="border-b border-black/5 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(255,255,255,0.55))] p-8 text-center">
                <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">pago rechazado</p>
                <h1 className="mt-3 text-3xl text-slate-900 font-display">No pudimos confirmar tu pago</h1>
                <p className="mx-auto mt-4 max-w-xl text-slate-600">
                  Hubo un problema al procesar la transaccion. Puedes volver a intentarlo o contactar al equipo de soporte.
                </p>
              </div>
              <CardContent className="p-8">
                <div className="rounded-[1.25rem] border border-red-100 bg-red-50/80 p-5 text-sm text-red-700">
                  Estado informado: <span className="font-semibold">{status || 'desconocido'}</span>.
                </div>
                <div className="mt-6">
                  <Link href="/" className="w-full">
                    <Button className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#12353d,#255d6a)] text-white hover:opacity-95">
                      Volver al inicio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/">
            <Button
              variant="link"
              className="mb-6 inline-flex items-center p-0 text-slate-600 hover:text-slate-900"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>

          <Card className="glass-panel overflow-hidden rounded-[2rem] border-0">
            <div className="border-b border-black/5 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.55))] p-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">reserva confirmada</p>
              <h1 className="mt-3 text-3xl text-slate-900 font-display md:text-4xl">
                Tu viaje ya esta listo
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                La compra se registro correctamente y tu reserva quedo confirmada. Te enviaremos el detalle por correo.
              </p>
            </div>
            <CardContent className="p-8">
              <div className="mb-6 rounded-[1.4rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,248,239,0.88),rgba(255,255,255,0.92))] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
                      Referencia de la reserva
                    </div>
                    <div className="mt-2 text-2xl font-display text-slate-900">
                      ID-{reserveId || 'N/A'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full border-black/10 bg-white/80 text-slate-700 hover:bg-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar ticket
                  </Button>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50/80 p-5 text-sm text-amber-900">
                <h2 className="mb-3 text-lg font-display text-slate-900">Informacion importante</h2>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Check-in:</span> llega al menos 15 minutos antes de la salida.
                  </p>
                  <p>
                    <span className="font-medium">Equipaje:</span> cada pasajero puede llevar una valija de hasta 20 kg y un articulo de mano.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <h2 className="text-lg font-display text-slate-900">¿Necesitas ayuda?</h2>
            <p className="mt-2 text-slate-600">
              Si algo no coincide con tu compra, nuestro equipo puede ayudarte a resolverlo.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-4 md:flex-row">
              <Link href="/">
                <Button variant="outline" className="rounded-full border-black/10 bg-white/75 px-6">
                  Reservar otro viaje
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
