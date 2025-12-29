import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTableSort } from '@/hooks/use-table-sort'

interface TestItem {
  id: number
  name: string
  age: number
}

const testItems: TestItem[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
]

const sortFns = {
  name: (a: TestItem, b: TestItem) => a.name.localeCompare(b.name),
  age: (a: TestItem, b: TestItem) => a.age - b.age,
}

describe('useTableSort', () => {
  describe('initial state', () => {
    it('should initialize with the provided sort column', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'name', sortFns)
      )

      expect(result.current.sortColumn).toBe('name')
    })

    it('should initialize with ascending direction', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'name', sortFns)
      )

      expect(result.current.sortDirection).toBe('asc')
    })

    it('should return items sorted by initial column in ascending order', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'name', sortFns)
      )

      expect(result.current.sortedItems[0].name).toBe('Alice')
      expect(result.current.sortedItems[1].name).toBe('Bob')
      expect(result.current.sortedItems[2].name).toBe('Charlie')
    })
  })

  describe('handleSort', () => {
    it('should toggle direction when same column is clicked', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'name', sortFns)
      )

      expect(result.current.sortDirection).toBe('asc')

      act(() => {
        result.current.handleSort('name')
      })

      expect(result.current.sortDirection).toBe('desc')
      expect(result.current.sortColumn).toBe('name')
    })

    it('should change column and reset to asc when different column is clicked', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'name', sortFns)
      )

      act(() => {
        result.current.handleSort('age')
      })

      expect(result.current.sortColumn).toBe('age')
      expect(result.current.sortDirection).toBe('asc')
    })

    it('should sort items in descending order when direction is desc', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'name', sortFns)
      )

      act(() => {
        result.current.handleSort('name') // toggle to desc
      })

      expect(result.current.sortedItems[0].name).toBe('Charlie')
      expect(result.current.sortedItems[1].name).toBe('Bob')
      expect(result.current.sortedItems[2].name).toBe('Alice')
    })
  })

  describe('sorting with different columns', () => {
    it('should sort by age correctly', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'age', sortFns)
      )

      expect(result.current.sortedItems[0].age).toBe(25) // Bob
      expect(result.current.sortedItems[1].age).toBe(30) // Alice
      expect(result.current.sortedItems[2].age).toBe(35) // Charlie
    })

    it('should sort by age in descending order', () => {
      const { result } = renderHook(() => 
        useTableSort(testItems, 'age', sortFns)
      )

      act(() => {
        result.current.handleSort('age')
      })

      expect(result.current.sortedItems[0].age).toBe(35) // Charlie
      expect(result.current.sortedItems[1].age).toBe(30) // Alice
      expect(result.current.sortedItems[2].age).toBe(25) // Bob
    })
  })

  describe('edge cases', () => {
    it('should handle undefined items', () => {
      const { result } = renderHook(() => 
        useTableSort(undefined, 'name', sortFns)
      )

      expect(result.current.sortedItems).toEqual([])
    })

    it('should handle empty array', () => {
      const { result } = renderHook(() => 
        useTableSort([], 'name', sortFns)
      )

      expect(result.current.sortedItems).toEqual([])
    })

    it('should not mutate original array', () => {
      const originalItems = [...testItems]
      const { result } = renderHook(() => 
        useTableSort(testItems, 'name', sortFns)
      )

      act(() => {
        result.current.handleSort('age')
      })

      expect(testItems).toEqual(originalItems)
    })
  })
})
