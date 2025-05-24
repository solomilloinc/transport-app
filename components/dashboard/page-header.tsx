import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-blue-500">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
