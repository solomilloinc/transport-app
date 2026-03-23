'use client';

import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchFilter({ value, onChange, placeholder }: SearchFilterProps) {
  return (
    <div className="relative flex-1">
      <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="search"
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border-black/8 bg-white/85 pl-11 text-slate-700 placeholder:text-slate-400 focus-visible:ring-emerald-700/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
