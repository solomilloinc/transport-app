'use client';

import { Bus } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import Image from "next/image";

export default function Footer() {
  const { identity } = useTenant();

  return (
    <footer className="mt-12 border-t border-sky-900/10 bg-[linear-gradient(180deg,rgba(11,43,99,0.98),rgba(8,24,58,1))] text-white">
      <div className="container">
        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-3">
              {identity.logoUrl ? (
                <Image src={identity.logoUrl} alt={identity.companyName} width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-1 ring-white/15" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Bus className="h-5 w-5 text-sky-300" />
                </div>
              )}
              <span className="text-2xl font-display text-white">
                {identity.companyNameShort}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              {identity.tagline}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Operacion digital
            </p>
            <p className="mt-2 text-sm text-slate-300">
              &copy; {new Date().getFullYear()} {identity.companyNameShort}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
