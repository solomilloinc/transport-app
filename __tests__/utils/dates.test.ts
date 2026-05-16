import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseToLocalDate, formatWithTimezone, isSameDayInArgentinaTZ } from '@/utils/dates'

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

  describe('isSameDayInArgentinaTZ', () => {
    it('returns true when both timestamps fall on the same calendar day in ART', () => {
      expect(
        isSameDayInArgentinaTZ('2026-05-13T10:00:00Z', '2026-05-13T23:00:00Z'),
      ).toBe(true)
    })

    it('returns true when a UTC string crosses midnight back to previous day in ART', () => {
      // 22:00 ART (=01:00 UTC next day) vs 10:00 ART same calendar day.
      // Raw `slice(0,10)` would report different days; ART-aware comparison must say same.
      const outbound = '2026-05-14T01:00:00Z' // 13 May 22:00 ART
      const ret = '2026-05-13T13:00:00Z' // 13 May 10:00 ART
      expect(isSameDayInArgentinaTZ(outbound, ret)).toBe(true)
    })

    it('returns false for distinct calendar days in ART', () => {
      expect(
        isSameDayInArgentinaTZ('2026-05-13T10:00:00Z', '2026-05-14T10:00:00Z'),
      ).toBe(false)
    })

    it('returns true for identical timestamps', () => {
      expect(
        isSameDayInArgentinaTZ('2026-05-13T12:00:00Z', '2026-05-13T12:00:00Z'),
      ).toBe(true)
    })

    it('handles timestamps with explicit -03:00 offset', () => {
      expect(
        isSameDayInArgentinaTZ('2026-05-13T22:00:00-03:00', '2026-05-13T08:00:00-03:00'),
      ).toBe(true)
    })
  })
})
