'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StatusOption {
  value: string;
  label: string;
}

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: StatusOption[];
  placeholder?: string;
}

export function StatusFilter({ value, onChange, options, placeholder = 'Filtrar por estado' }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
