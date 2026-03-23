import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="glass-panel rounded-[1.75rem] px-6 py-5 md:px-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">vista operativa</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
