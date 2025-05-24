// Función para obtener el valor de una opción por ID
export function getOptionValueById(options: Array<{ id: number; value: string; label: string }>, id: number): string {
  const option = options.find((opt) => opt.id === id)
  return option ? option.value : ""
}

// Función para obtener la etiqueta de una opción por ID
export function getOptionLabelById(options: Array<{ id: number; value: string; label: string }>, id: number): string {
  const option = options.find((opt) => opt.id === id)
  return option ? option.label : ""
}

// Función para obtener el ID de una opción por valor
export function getOptionIdByValue(
  options: Array<{ id: number; value: string; label: string }>,
  value: string,
): number {
  const option = options.find((opt) => opt.value === value)
  return option ? option.id : 0
}
