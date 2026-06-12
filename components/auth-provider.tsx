"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { MandatoryProfileDialog } from "@/components/account/mandatory-profile-dialog";
import { useSessionError } from "@/hooks/use-session-error";

function SessionGuards() {
  useSessionError();
  return null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuards />
      {children}
      <MandatoryProfileDialog />
    </SessionProvider>
  );
}
