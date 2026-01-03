import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useApi } from '@/hooks/use-api'
import type { PagedResponse, UseApiCall } from '@/services/types'

describe('useApi', () => {
  interface TestData {
    id: number
    name: string
  }

  interface TestParams {
    filter?: string
  }

  const mockResponse: PagedResponse<TestData> = {
    Items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ],
    PageNumber: 1,
    PageSize: 10,
    TotalRecords: 2,
    TotalPages: 1,
  }

  const createMockApiCall = (
    resolveWith: PagedResponse<TestData>,
    delay = 0
  ): ((params: TestParams) => UseApiCall<TestData>) => {
    return (params: TestParams) => ({
      call: new Promise((resolve) => {
        setTimeout(() => resolve(resolveWith), delay)
      }),
    })
  }

  const createFailingApiCall = (
    error: Error
  ): ((params: TestParams) => UseApiCall<TestData>) => {
    return (params: TestParams) => ({
      call: Promise.reject(error),
    })
  }

  describe('initial state', () => {
    it('should not be loading initially when autoFetch is false', () => {
      const apiCall = createMockApiCall(mockResponse)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      expect(result.current.loading).toBe(false)
    })

    it('should have empty data initially', () => {
      const apiCall = createMockApiCall(mockResponse)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      expect(result.current.data).toEqual({})
    })

    it('should have no error initially', () => {
      const apiCall = createMockApiCall(mockResponse)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      expect(result.current.error).toBeNull()
    })
  })

  describe('fetch', () => {
    it('should set loading to true when fetch is called', async () => {
      const apiCall = createMockApiCall(mockResponse, 100)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      act(() => {
        result.current.fetch({})
      })

      expect(result.current.loading).toBe(true)
    })

    it('should populate data on successful fetch', async () => {
      const apiCall = createMockApiCall(mockResponse)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      act(() => {
        result.current.fetch({})
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockResponse)
    })

    it('should set loading to false after fetch completes', async () => {
      const apiCall = createMockApiCall(mockResponse)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      act(() => {
        result.current.fetch({})
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should clear error on successful fetch', async () => {
      const apiCall = createMockApiCall(mockResponse)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      act(() => {
        result.current.fetch({})
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should set error on failed fetch', async () => {
      const testError = new Error('Network error')
      const apiCall = createFailingApiCall(testError)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      act(() => {
        result.current.fetch({})
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(testError)
    })

    it('should set loading to false after error', async () => {
      const testError = new Error('Network error')
      const apiCall = createFailingApiCall(testError)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      act(() => {
        result.current.fetch({})
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('reset', () => {
    it('should reset data to empty object', async () => {
      const apiCall = createMockApiCall(mockResponse)
      const { result } = renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { autoFetch: false })
      )

      act(() => {
        result.current.fetch({})
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toEqual({})
    })
  })

  describe('autoFetch', () => {
    it('should trigger fetch when autoFetch is true', async () => {
      const apiCall = vi.fn().mockImplementation(() => ({
        call: Promise.resolve(mockResponse)
      }))
      
      renderHook(() =>
        useApi<TestData, TestParams>(apiCall, { 
          autoFetch: true, 
          params: { filter: 'test' } 
        })
      )

      // The apiCall should have been called at least once
      await waitFor(() => {
        expect(apiCall).toHaveBeenCalled()
      })
    })
  })
})
