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
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input type="search" placeholder={placeholder} className="w-full pl-8" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
