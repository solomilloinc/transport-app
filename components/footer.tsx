'use client';

import { Bus } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import Image from "next/image";

export default function Footer() {
  const { identity } = useTenant();

  return (
    <footer className="bg-blue-900 text-white py-8 mt-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {identity.logoUrl ? (
                <Image src={identity.logoUrl} alt={identity.companyName} width={24} height={24} className="h-6 w-6" />
              ) : (
                <Bus className="h-6 w-6 text-blue-300" />
              )}
              <span className="text-xl font-bold font-display">
                {identity.companyNameShort}
              </span>
            </div>
            <p className="text-blue-200 text-sm">
              {identity.tagline}
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-blue-200 text-sm">
              &copy; {new Date().getFullYear()} {identity.companyNameShort}. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
