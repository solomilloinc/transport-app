'use client';

import { ApiSelect, type SelectOption } from '@/components/dashboard/select';

interface Props {
  options: SelectOption[];
  /** Etiqueta de la opción "sin filtro" (ej. "Todas las rutas"). */
  allLabel: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  searchPlaceholder?: string;
}

/**
 * Wrapper fino sobre `ApiSelect` para los filtros de entidad de la Reportería
 * (Ruta / Vehículo / Chofer). Agrega una opción "Todas" (`all`) que mapea a
 * `undefined` — así el filtro se omite del payload cuando no se elige nada.
 */
export function EntitySelect({ options, allLabel, value, onChange, searchPlaceholder }: Props) {
  const withAll: SelectOption[] = [{ id: 'all', value: 'all', label: allLabel }, ...options];

  return (
    <ApiSelect
      searchable
      searchPlaceholder={searchPlaceholder ?? 'Buscar...'}
      placeholder={allLabel}
      options={withAll}
      value={value != null ? String(value) : 'all'}
      onValueChange={(v) => onChange(v === 'all' ? undefined : Number(v))}
    />
  );
}
