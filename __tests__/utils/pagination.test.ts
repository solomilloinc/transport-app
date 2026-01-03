import { describe, it, expect } from 'vitest'
import { withDefaultPagination } from '@/utils/pagination'

describe('pagination utilities', () => {
  describe('withDefaultPagination', () => {
    it('should return default values when no params provided', () => {
      const result = withDefaultPagination()
      
      expect(result).toEqual({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'fecha',
        sortDescending: true,
        filters: {},
      })
    })

    it('should preserve provided pageNumber', () => {
      const result = withDefaultPagination({ pageNumber: 5 })
      
      expect(result.pageNumber).toBe(5)
      expect(result.pageSize).toBe(10) // default
    })

    it('should preserve provided pageSize', () => {
      const result = withDefaultPagination({ pageSize: 25 })
      
      expect(result.pageSize).toBe(25)
      expect(result.pageNumber).toBe(1) // default
    })

    it('should preserve provided sortBy', () => {
      const result = withDefaultPagination({ sortBy: 'nombre' })
      
      expect(result.sortBy).toBe('nombre')
    })

    it('should preserve provided sortDescending', () => {
      const result = withDefaultPagination({ sortDescending: false })
      
      expect(result.sortDescending).toBe(false)
    })

    it('should preserve provided filters', () => {
      const filters = { status: 'active', city: 'Buenos Aires' }
      const result = withDefaultPagination({ filters })
      
      expect(result.filters).toEqual(filters)
    })

    it('should merge all provided params with defaults', () => {
      const result = withDefaultPagination({
        pageNumber: 3,
        pageSize: 20,
        sortBy: 'name',
        sortDescending: false,
        filters: { active: true },
      })
      
      expect(result).toEqual({
        pageNumber: 3,
        pageSize: 20,
        sortBy: 'name',
        sortDescending: false,
        filters: { active: true },
      })
    })
  })
})
