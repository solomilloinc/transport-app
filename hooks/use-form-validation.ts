"use client"

import { useState, useCallback } from "react"

export type ValidationRule<T> = {
  validate: (value: T, formData?: Record<string, any>) => boolean
  message: string
}

export type FieldValidation<T> = {
  required?: boolean | { message: string }
  rules?: ValidationRule<T>[]
}

export type FormValidationConfig = Record<string, FieldValidation<any>>

export type ValidationErrors = Record<string, string | undefined>

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationConfig: FormValidationConfig,
) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validar un campo específico
  const validateField = useCallback(
    (name: string, value: any): string | undefined => {
      const fieldValidation = validationConfig[name]
      if (!fieldValidation) return undefined

      // Validación de campo requerido
      if (fieldValidation.required) {
        const isRequired = typeof fieldValidation.required === "boolean" ? fieldValidation.required : true
        const message =
          typeof fieldValidation.required === "object" ? fieldValidation.required.message : "Este campo es obligatorio"

        if (isRequired && (value === undefined || value === null || value === "")) {
          return message
        }
      }

      // Validación de reglas personalizadas
      if (fieldValidation.rules) {
        for (const rule of fieldValidation.rules) {
          if (!rule.validate(value, data)) {
            return rule.message
          }
        }
      }

      return undefined
    },
    [data, validationConfig],
  )

  // Validar todos los campos
 const validateForm = useCallback((fieldsToValidate?: string[]): boolean => {
  const newErrors: ValidationErrors = {}
  let isValid = true

  const fields = fieldsToValidate ?? Object.keys(validationConfig)

  for (const fieldName of fields) {
    const error = validateField(fieldName, data[fieldName])
    if (error) {
      newErrors[fieldName] = error
      isValid = false
    }
  }

  setErrors((prev) => ({ ...prev, ...newErrors }))
  return isValid
}, [data, validateField, validationConfig])


  // Actualizar un campo
  const setField = useCallback(
    (name: string, value: any) => {
      setData((prev) => ({ ...prev, [name]: value }))

      // Marcar el campo como tocado
      if (!touchedFields[name]) {
        setTouchedFields((prev) => ({ ...prev, [name]: true }))
      }

      // Validar el campo si ya ha sido tocado
      if (touchedFields[name]) {
        const error = validateField(name, value)
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    },
    [touchedFields, validateField],
  )

  // Manejar el envío del formulario
  const handleSubmit = useCallback(
    async (onSubmit: (data: T) => Promise<void> | void, fieldsToValidate?: string[]) => {
      setIsSubmitting(true)

    const allTouched = Object.keys(validationConfig).reduce((acc, field) => ({ ...acc, [field]: true }), {})
    setTouchedFields(allTouched)

    const isValid = validateForm(fieldsToValidate)

    if (isValid) {
      try {
        await onSubmit(data)
      } catch (error) {
        console.error("Error al enviar el formulario:", error)
      }
    }

    setIsSubmitting(false)
  },
  [data, validateForm, validationConfig],
)


  // Resetear el formulario
  const resetForm = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouchedFields({})
    setIsSubmitting(false)
  }, [initialData])

  return {
    data,
    errors,
    touchedFields,
    isSubmitting,
    setField,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
    setIsSubmitting,
  }
}