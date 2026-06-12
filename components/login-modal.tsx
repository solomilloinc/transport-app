"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isAdminRole, normalizeRole } from "@/lib/auth-role";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const redirectAfterLogin = async () => {
    const session = await getSession();
    const role = normalizeRole(session?.user?.role);

    onClose();

    if (role === "client") {
      router.push(session?.user?.needsProfileCompletion ? "/account/profile" : "/account/bookings");
      return;
    }

    if (role === "user" || isAdminRole(role)) {
      router.push("/admin/reserves");
      return;
    }

    router.refresh();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Credenciales invalidas");
        return;
      }

      await redirectAfterLogin();
    } catch {
      setError("Ocurrió un error. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("google", { redirect: false });
      if (result?.error) {
        setError("Error con login de Google");
        return;
      }

      await redirectAfterLogin();
    } catch {
      setError("Ocurrió un error con el inicio de sesión de Google. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">
            Inicia Sesion en tu cuenta
          </DialogTitle>
          <DialogDescription>
            Accede a tus reservas, guarda tus datos de pago y disfruta de una
            experiencia de pago más rápida.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 flex items-start rounded-md bg-red-50 p-3 text-red-700">
            <AlertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contrasena</Label>
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-blue-600"
              >
                Olvido la contrasena?
              </Button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="password"
                type="password"
                placeholder="********"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <div className="mt-4 space-y-4">
          <Button
            type="button"
            variant="outline"
            className="flex w-full items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Continuar con Google
          </Button>
        </div>

        <Separator className="my-4" />
      </DialogContent>
    </Dialog>
  );
}
