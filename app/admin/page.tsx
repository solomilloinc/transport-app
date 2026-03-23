'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/reserves');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(56,87,69,0.12),transparent_35%),linear-gradient(180deg,#f7f7f2,#eef1ea)]">
      <div className="rounded-[2rem] border border-black/6 bg-white/82 px-10 py-12 text-center shadow-[0_26px_60px_rgba(18,28,20,0.10)]">
        <div className="mx-auto h-20 w-20 animate-spin rounded-full border-[5px] border-emerald-100 border-t-emerald-700"></div>
        <p className="mt-6 font-display text-2xl text-slate-900">Abriendo consola operativa</p>
        <p className="mt-2 text-sm text-slate-500">Te estamos llevando al tablero principal del equipo.</p>
      </div>
    </div>
  );
}
