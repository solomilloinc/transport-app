import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFormValidation } from '@/hooks/use-form-validation'

describe('useFormValidation', () => {
  const initialData = {
    email: '',
    name: '',
    age: 0,
  }

  const validationConfig = {
    email: {
      required: { message: 'Email es requerido' },
      rules: [
        {
          validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          message: 'Email inválido',
        },
      ],
    },
    name: {
      required: { message: 'Nombre es requerido' },
    },
    age: {
      rules: [
        {
          validate: (value: number) => value >= 18,
          message: 'Debe ser mayor de 18',
        },
      ],
    },
  }

  describe('initial state', () => {
    it('should initialize with provided data', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      expect(result.current.data).toEqual(initialData)
    })

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      expect(result.current.errors).toEqual({})
    })

    it('should initialize with empty touched fields', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      expect(result.current.touchedFields).toEqual({})
    })

    it('should not be submitting initially', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('validateField', () => {
    it('should return error for empty required field', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      const error = result.current.validateField('email', '')
      expect(error).toBe('Email es requerido')
    })

    it('should return error for invalid custom rule', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      const error = result.current.validateField('email', 'invalid-email')
      expect(error).toBe('Email inválido')
    })

    it('should return undefined for valid field', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      const error = result.current.validateField('email', 'test@example.com')
      expect(error).toBeUndefined()
    })

    it('should return undefined for field without validation', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      const error = result.current.validateField('unknownField', 'any value')
      expect(error).toBeUndefined()
    })
  })

  describe('setField', () => {
    it('should update field value', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      act(() => {
        result.current.setField('name', 'John')
      })

      expect(result.current.data.name).toBe('John')
    })

    it('should mark field as touched', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      act(() => {
        result.current.setField('name', 'John')
      })

      expect(result.current.touchedFields.name).toBe(true)
    })

    it('should validate field on subsequent changes after touched', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      // First change - marks as touched
      act(() => {
        result.current.setField('name', 'John')
      })

      // Second change - should validate
      act(() => {
        result.current.setField('name', '')
      })

      expect(result.current.errors.name).toBe('Nombre es requerido')
    })
  })

  describe('validateForm', () => {
    it('should return false when form has errors', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      let isValid: boolean = false
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(false)
    })

    it('should return true when form is valid', () => {
      const validData = {
        email: 'test@example.com',
        name: 'John',
        age: 25,
      }

      const { result } = renderHook(() =>
        useFormValidation(validData, validationConfig)
      )

      let isValid: boolean = false
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(true)
    })

    it('should validate only specified fields when provided', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      // Only validate name field
      act(() => {
        result.current.setField('name', 'John')
      })

      let isValid: boolean = false
      act(() => {
        isValid = result.current.validateForm(['name'])
      })

      // Should be valid because only name was checked and it's valid
      expect(isValid).toBe(true)
    })

    it('should populate errors object', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      act(() => {
        result.current.validateForm()
      })

      expect(result.current.errors.email).toBe('Email es requerido')
      expect(result.current.errors.name).toBe('Nombre es requerido')
    })
  })

  describe('handleSubmit', () => {
    it('should call onSubmit when form is valid', async () => {
      const validData = {
        email: 'test@example.com',
        name: 'John',
        age: 25,
      }

      const onSubmit = vi.fn()

      const { result } = renderHook(() =>
        useFormValidation(validData, validationConfig)
      )

      await act(async () => {
        await result.current.handleSubmit(onSubmit)
      })

      expect(onSubmit).toHaveBeenCalledWith(validData)
    })

    it('should not call onSubmit when form is invalid', async () => {
      const onSubmit = vi.fn()

      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      await act(async () => {
        await result.current.handleSubmit(onSubmit)
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should mark all fields as touched after submit attempt', async () => {
      const onSubmit = vi.fn()

      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      await act(async () => {
        await result.current.handleSubmit(onSubmit)
      })

      expect(result.current.touchedFields.email).toBe(true)
      expect(result.current.touchedFields.name).toBe(true)
      expect(result.current.touchedFields.age).toBe(true)
    })
  })

  describe('resetForm', () => {
    it('should reset data to initial values', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      act(() => {
        result.current.setField('name', 'John')
        result.current.setField('email', 'john@example.com')
      })

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.data).toEqual(initialData)
    })

    it('should clear errors', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      act(() => {
        result.current.validateForm()
      })

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.errors).toEqual({})
    })

    it('should clear touched fields', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, validationConfig)
      )

      act(() => {
        result.current.setField('name', 'John')
      })

      expect(result.current.touchedFields.name).toBe(true)

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.touchedFields).toEqual({})
    })
  })
})
