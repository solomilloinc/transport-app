import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseToLocalDate, formatWithTimezone } from '@/utils/dates'

describe('dates utilities', () => {
  describe('parseToLocalDate', () => {
    it('should parse ISO string to Date object', () => {
      const isoString = '2024-06-15T12:00:00.000Z'
      const result = parseToLocalDate(isoString)
      
      expect(result).toBeInstanceOf(Date)
    })

    it('should parse dates correctly', () => {
      const isoString = '2024-12-25T00:00:00.000Z'
      const result = parseToLocalDate(isoString)
      
      // The date should be parsed (we check it's a valid date)
      expect(result.getTime()).not.toBeNaN()
    })
  })

  describe('formatWithTimezone', () => {
    it('should format date with Argentina timezone', () => {
      const isoString = '2024-06-15T15:30:00.000Z'
      const result = formatWithTimezone(isoString)
      
      // Should return a non-empty string
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should return empty string for undefined input', () => {
      const result = formatWithTimezone(undefined)
      expect(result).toBe('')
    })

    it('should return empty string for empty string input', () => {
      const result = formatWithTimezone('')
      expect(result).toBe('')
    })

    it('should use custom timezone when provided', () => {
      const isoString = '2024-06-15T15:30:00.000Z'
      const result = formatWithTimezone(isoString, 'America/Los_Angeles')
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should format date in medium style (es-AR locale)', () => {
      const isoString = '2024-12-25T12:00:00.000Z'
      const result = formatWithTimezone(isoString)
      
      // In es-AR medium format, should contain year
      expect(result).toMatch(/2024/)
    })
  })
})
