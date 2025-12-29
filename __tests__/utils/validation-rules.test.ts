import { describe, it, expect } from 'vitest'
import {
  emailRule,
  minLengthRule,
  maxLengthRule,
  minValueRule,
  maxValueRule,
  matchFieldRule,
  phoneRule,
  numbersOnlyRule,
  lettersOnlyRule,
  dateFormatRule,
} from '@/utils/validation-rules'

describe('validation-rules', () => {
  describe('emailRule', () => {
    it('should validate correct emails', () => {
      expect(emailRule.validate('test@example.com')).toBe(true)
      expect(emailRule.validate('user.name@domain.com.ar')).toBe(true)
      expect(emailRule.validate('user+tag@gmail.com')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(emailRule.validate('invalid')).toBe(false)
      expect(emailRule.validate('missing@domain')).toBe(false)
      expect(emailRule.validate('@nodomain.com')).toBe(false)
      expect(emailRule.validate('spaces in@email.com')).toBe(false)
      expect(emailRule.validate('')).toBe(false)
    })

    it('should have correct error message', () => {
      expect(emailRule.message).toBe('Ingrese un email válido')
    })
  })

  describe('minLengthRule', () => {
    it('should validate strings meeting minimum length', () => {
      const rule = minLengthRule(5)
      expect(rule.validate('hello')).toBe(true)
      expect(rule.validate('hello world')).toBe(true)
    })

    it('should reject strings below minimum length', () => {
      const rule = minLengthRule(5)
      expect(rule.validate('hi')).toBe(false)
      expect(rule.validate('')).toBe(false)
    })

    it('should have correct error message', () => {
      const rule = minLengthRule(7)
      expect(rule.message).toBe('Debe tener al menos 7 caracteres')
    })
  })

  describe('maxLengthRule', () => {
    it('should validate strings within maximum length', () => {
      const rule = maxLengthRule(10)
      expect(rule.validate('hello')).toBe(true)
      expect(rule.validate('1234567890')).toBe(true)
      expect(rule.validate('')).toBe(true)
    })

    it('should reject strings exceeding maximum length', () => {
      const rule = maxLengthRule(5)
      expect(rule.validate('hello world')).toBe(false)
      expect(rule.validate('123456')).toBe(false)
    })

    it('should have correct error message', () => {
      const rule = maxLengthRule(8)
      expect(rule.message).toBe('Debe tener como máximo 8 caracteres')
    })
  })

  describe('minValueRule', () => {
    it('should validate numbers at or above minimum', () => {
      const rule = minValueRule(10)
      expect(rule.validate(10)).toBe(true)
      expect(rule.validate(100)).toBe(true)
    })

    it('should reject numbers below minimum', () => {
      const rule = minValueRule(10)
      expect(rule.validate(9)).toBe(false)
      expect(rule.validate(0)).toBe(false)
      expect(rule.validate(-5)).toBe(false)
    })

    it('should have correct error message', () => {
      const rule = minValueRule(5)
      expect(rule.message).toBe('El valor debe ser mayor o igual a 5')
    })
  })

  describe('maxValueRule', () => {
    it('should validate numbers at or below maximum', () => {
      const rule = maxValueRule(100)
      expect(rule.validate(100)).toBe(true)
      expect(rule.validate(50)).toBe(true)
      expect(rule.validate(0)).toBe(true)
    })

    it('should reject numbers above maximum', () => {
      const rule = maxValueRule(100)
      expect(rule.validate(101)).toBe(false)
      expect(rule.validate(1000)).toBe(false)
    })

    it('should have correct error message', () => {
      const rule = maxValueRule(50)
      expect(rule.message).toBe('El valor debe ser menor o igual a 50')
    })
  })

  describe('matchFieldRule', () => {
    it('should validate when fields match', () => {
      const rule = matchFieldRule('password', 'Contraseña')
      const formData = { password: 'secret123' }
      expect(rule.validate('secret123', formData)).toBe(true)
    })

    it('should reject when fields do not match', () => {
      const rule = matchFieldRule('password', 'Contraseña')
      const formData = { password: 'secret123' }
      expect(rule.validate('different', formData)).toBe(false)
    })

    it('should have correct error message', () => {
      const rule = matchFieldRule('email', 'Email')
      expect(rule.message).toBe('Debe coincidir con Email')
    })
  })

  describe('phoneRule', () => {
    it('should validate correct phone numbers', () => {
      expect(phoneRule.validate('12345678')).toBe(true)
      expect(phoneRule.validate('+5491123456789')).toBe(true)
      expect(phoneRule.validate('011 1234 5678')).toBe(true) // spaces are stripped
    })

    it('should reject invalid phone numbers', () => {
      expect(phoneRule.validate('123')).toBe(false) // too short
      expect(phoneRule.validate('abc12345678')).toBe(false) // letters
      expect(phoneRule.validate('')).toBe(false)
    })

    it('should have correct error message', () => {
      expect(phoneRule.message).toBe('Ingrese un número de teléfono válido')
    })
  })

  describe('numbersOnlyRule', () => {
    it('should validate strings with only numbers', () => {
      expect(numbersOnlyRule.validate('12345678')).toBe(true)
      expect(numbersOnlyRule.validate('0')).toBe(true)
      expect(numbersOnlyRule.validate('')).toBe(true)
    })

    it('should reject strings with non-numeric characters', () => {
      expect(numbersOnlyRule.validate('123abc')).toBe(false)
      expect(numbersOnlyRule.validate('12.34')).toBe(false)
      expect(numbersOnlyRule.validate('12-34')).toBe(false)
    })

    it('should have correct error message', () => {
      expect(numbersOnlyRule.message).toBe('Solo se permiten números')
    })
  })

  describe('lettersOnlyRule', () => {
    it('should validate strings with only letters and spaces', () => {
      expect(lettersOnlyRule.validate('Juan')).toBe(true)
      expect(lettersOnlyRule.validate('María José')).toBe(true)
      expect(lettersOnlyRule.validate('Ñoño')).toBe(true) // spanish ñ
      expect(lettersOnlyRule.validate('')).toBe(true)
    })

    it('should reject strings with numbers or special characters', () => {
      expect(lettersOnlyRule.validate('Juan123')).toBe(false)
      expect(lettersOnlyRule.validate('Juan!')).toBe(false)
      expect(lettersOnlyRule.validate('Juan@Carlos')).toBe(false)
    })

    it('should have correct error message', () => {
      expect(lettersOnlyRule.message).toBe('Solo se permiten letras')
    })
  })

  describe('dateFormatRule', () => {
    it('should validate correct date format (YYYY-MM-DD)', () => {
      expect(dateFormatRule.validate('2024-01-15')).toBe(true)
      expect(dateFormatRule.validate('1990-12-31')).toBe(true)
    })

    it('should reject incorrect date formats', () => {
      expect(dateFormatRule.validate('15-01-2024')).toBe(false) // DD-MM-YYYY
      expect(dateFormatRule.validate('01/15/2024')).toBe(false) // MM/DD/YYYY
      expect(dateFormatRule.validate('2024-1-5')).toBe(false) // missing zeros
      expect(dateFormatRule.validate('invalid')).toBe(false)
      expect(dateFormatRule.validate('')).toBe(false)
    })

    it('should have correct error message', () => {
      expect(dateFormatRule.message).toBe('Formato de fecha inválido (YYYY-MM-DD)')
    })
  })
})
