import type { ValidationRule } from "@/hooks/use-form-validation"

// Regla para validar email
export const emailRule: ValidationRule<string> = {
  validate: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },
  message: "Ingrese un email válido",
}

// Regla para validar longitud mínima
export function minLengthRule(length: number): ValidationRule<string> {
  return {
    validate: (value) => value.length >= length,
    message: `Debe tener al menos ${length} caracteres`,
  }
}

// Regla para validar longitud máxima
export function maxLengthRule(length: number): ValidationRule<string> {
  return {
    validate: (value) => value.length <= length,
    message: `Debe tener como máximo ${length} caracteres`,
  }
}

// Regla para validar valor mínimo (números)
export function minValueRule(min: number): ValidationRule<number> {
  return {
    validate: (value) => value >= min,
    message: `El valor debe ser mayor o igual a ${min}`,
  }
}

// Regla para validar valor máximo (números)
export function maxValueRule(max: number): ValidationRule<number> {
  return {
    validate: (value) => value <= max,
    message: `El valor debe ser menor o igual a ${max}`,
  }
}

// Regla para validar que dos campos coincidan
export function matchFieldRule(fieldName: string, fieldLabel: string): ValidationRule<string> {
  return {
    validate: (value, formData) => value === formData?.[fieldName],
    message: `Debe coincidir con ${fieldLabel}`,
  }
}

// Regla para validar formato de teléfono
export const phoneRule: ValidationRule<string> = {
  validate: (value) => {
    const phoneRegex = /^\+?[0-9]{8,15}$/
    return phoneRegex.test(value.replace(/\s+/g, ""))
  },
  message: "Ingrese un número de teléfono válido",
}

// Regla para validar solo números
export const numbersOnlyRule: ValidationRule<string> = {
  validate: (value) => /^[0-9]*$/.test(value),
  message: "Solo se permiten números",
}

// Regla para validar solo letras
export const lettersOnlyRule: ValidationRule<string> = {
  validate: (value) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value),
  message: "Solo se permiten letras",
}

// Regla para validar formato de fecha
export const dateFormatRule: ValidationRule<string> = {
  validate: (value) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    return dateRegex.test(value)
  },
  message: "Formato de fecha inválido (YYYY-MM-DD)",
}
