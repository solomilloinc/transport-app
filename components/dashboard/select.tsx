'use client';

import { useState, useEffect } from 'react';
import { Loader2Icon, AlertCircleIcon, SearchIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SelectOption {
  id: string | number;
  value: string;
  label: string;
  [key: string]: any; // Para propiedades adicionales
}

interface ApiSelectProps {
  // Propiedades básicas
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;

  // Propiedades relacionadas con la API
  apiUrl?: string;
  fetchOptions?: () => Promise<SelectOption[]>;
  options?: SelectOption[];

  // Propiedades de configuración
  idKey?: string;
  valueKey?: string;
  labelKey?: string;

  // Propiedades de estado
  loading?: boolean;
  error?: string | null;

  // Propiedades de búsqueda
  searchable?: boolean;
  searchPlaceholder?: string;

  // Mensajes personalizados
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;

  // Callbacks adicionales
  onFocus?: () => void;
  onBlur?: () => void;
  onOpen?: () => void;
}

export function ApiSelect({
  // Propiedades básicas
  value,
  onValueChange,
  placeholder = 'Seleccionar opción',
  disabled = false,
  className,
  triggerClassName,
  contentClassName,

  // Propiedades relacionadas con la API
  apiUrl,
  fetchOptions,
  options: propOptions,

  // Propiedades de configuración
  idKey = 'id',
  valueKey = 'value',
  labelKey = 'label',

  // Propiedades de estado
  loading: propLoading,
  error: propError,

  // Propiedades de búsqueda
  searchable = false,
  searchPlaceholder = 'Buscar...',

  // Mensajes personalizados
  loadingMessage = 'Cargando opciones...',
  errorMessage = 'Error al cargar opciones',
  emptyMessage = 'No hay opciones disponibles',

  // Callbacks adicionales
  onFocus,
  onBlur,
  onOpen,
}: ApiSelectProps) {
  // Estados internos
  const [options, setOptions] = useState<SelectOption[]>(propOptions || []);
  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>(propOptions || []);
  const [loading, setLoading] = useState(propLoading || false);
  const [error, setError] = useState<string | null>(propError || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Actualizar opciones cuando cambian las propOptions
  useEffect(() => {
    if (propOptions) {
      setOptions(propOptions);
      setFilteredOptions(propOptions);
      setHasLoaded(true);
    }
  }, [propOptions]);

  // Actualizar estados de loading y error cuando cambian las props
  useEffect(() => {
    setLoading(propLoading || false);
    setError(propError || null);
  }, [propLoading, propError]);

  // Actualizar opciones filtradas cuando cambia la búsqueda
  useEffect(() => {
    if (!searchable || !searchQuery.trim()) {
      setFilteredOptions(options);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = options.filter(
      (option) => option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query)
    );

    setFilteredOptions(filtered);
  }, [searchQuery, options, searchable]);

  // Manejar la apertura del select
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setSearchQuery('');
      if (onOpen) onOpen();
    }
  };

  // Modificar la función getSelectedLabel para asegurar que compare correctamente los valores
  const getSelectedLabel = () => {
    // Si no hay valor seleccionado o estamos cargando, mostrar el placeholder
    if (!value || loading) {
      return placeholder;
    }

    // Buscar la opción seleccionada - asegurarse de comparar como strings
    const selectedOption = options.find((option) => String(option.value) === String(value));
    return selectedOption ? selectedOption.label : placeholder;
  };

  // Renderizar el contenido del select
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          {loadingMessage}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-2 text-sm text-red-500">
          <AlertCircleIcon className="mr-2 h-4 w-4" />
          {errorMessage}
        </div>
      );
    }

    if (filteredOptions.length === 0) {
      return (
        <div className="py-2 text-center text-sm text-muted-foreground">
          {searchQuery ? 'No se encontraron resultados' : emptyMessage}
        </div>
      );
    }

    return filteredOptions.map((option) => (
      <SelectItem key={`${option.id}-${option.label}`} value={option.value.toString()}>
        {option.label}
      </SelectItem>
    ));
  };

  return (
    <div className={cn('relative', className)}>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger className={cn(loading && 'opacity-70', triggerClassName)} onFocus={onFocus} onBlur={onBlur}>
          <SelectValue placeholder={placeholder}>
            {loading ? placeholder : value ? getSelectedLabel() : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {searchable && (
            <div className="px-2 py-2 sticky top-0 bg-background z-10">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          {renderContent()}
        </SelectContent>
      </Select>

      {loading && !isOpen && (
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
          {loadingMessage}
        </div>
      )}

      {error && !isOpen && (
        <div className="flex items-center mt-1 text-xs text-red-500">
          <AlertCircleIcon className="h-3 w-3 mr-1" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
