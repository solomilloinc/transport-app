import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('should handle undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2')
    expect(result).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false
    
    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    )
    
    expect(result).toBe('base active')
  })

  it('should merge tailwind classes correctly (last wins)', () => {
    // tailwind-merge should resolve conflicting classes
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('should merge tailwind color classes correctly', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('should handle empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2'])
    expect(result).toBe('class1 class2')
  })

  it('should handle object syntax', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    })
    expect(result).toBe('class1 class3')
  })

  it('should combine different input types', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-class': true },
      'string-class'
    )
    expect(result).toContain('base')
    expect(result).toContain('array-class')
    expect(result).toContain('object-class')
    expect(result).toContain('string-class')
  })
})
