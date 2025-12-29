import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { CheckoutProvider, useCheckout, type LockState, type CheckoutState } from '@/contexts/CheckoutContext'
import type { ReserveSummaryItem } from '@/interfaces/reserve'

// Helper to render hook with provider
const renderCheckoutHook = () => {
  return renderHook(() => useCheckout(), {
    wrapper: ({ children }) => <CheckoutProvider>{children}</CheckoutProvider>,
  })
}

describe('CheckoutContext', () => {
  describe('initial state', () => {
    it('should have null outboundTrip initially', () => {
      const { result } = renderCheckoutHook()
      
      expect(result.current.checkout.outboundTrip).toBeNull()
    })

    it('should have 1 passenger initially', () => {
      const { result } = renderCheckoutHook()
      
      expect(result.current.checkout.passengers).toBe(1)
    })

    it('should have null returnTrip initially', () => {
      const { result } = renderCheckoutHook()
      
      expect(result.current.checkout.returnTrip).toBeNull()
    })
  })

  describe('setCheckout', () => {
    it('should update checkout state', () => {
      const { result } = renderCheckoutHook()
      
      const newState: CheckoutState = {
        outboundTrip: { Id: 1 } as ReserveSummaryItem,
        returnTrip: null,
        passengers: 3,
      }

      act(() => {
        result.current.setCheckout(newState)
      })

      expect(result.current.checkout.outboundTrip).toEqual({ Id: 1 })
      expect(result.current.checkout.passengers).toBe(3)
    })
  })

  describe('setLockState', () => {
    it('should set lock state', () => {
      const { result } = renderCheckoutHook()
      
      const lockState: LockState = {
        lockToken: 'abc123',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        timeoutMinutes: 10,
      }

      act(() => {
        result.current.setLockState(lockState)
      })

      expect(result.current.checkout.lockState).toEqual(lockState)
    })

    it('should clear lock state when null is passed', () => {
      const { result } = renderCheckoutHook()
      
      // First set a lock state
      const lockState: LockState = {
        lockToken: 'abc123',
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        timeoutMinutes: 10,
      }

      act(() => {
        result.current.setLockState(lockState)
      })

      // Then clear it
      act(() => {
        result.current.setLockState(null)
      })

      expect(result.current.checkout.lockState).toBeNull()
    })
  })

  describe('clearCheckout', () => {
    it('should reset to default state', () => {
      const { result } = renderCheckoutHook()
      
      // Set some state
      act(() => {
        result.current.setCheckout({
          outboundTrip: { Id: 1 } as ReserveSummaryItem,
          returnTrip: { Id: 2 } as ReserveSummaryItem,
          passengers: 5,
        })
      })

      // Clear it
      act(() => {
        result.current.clearCheckout()
      })

      expect(result.current.checkout.outboundTrip).toBeNull()
      expect(result.current.checkout.returnTrip).toBeNull()
      expect(result.current.checkout.passengers).toBe(1)
    })
  })

  describe('isLockValid', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return false when no lock state', () => {
      const { result } = renderCheckoutHook()
      
      expect(result.current.isLockValid()).toBe(false)
    })

    it('should return true when lock is not expired', () => {
      const { result } = renderCheckoutHook()
      
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

      act(() => {
        result.current.setLockState({
          lockToken: 'abc123',
          expiresAt: '2024-01-01T12:10:00Z', // 10 minutes from now
          timeoutMinutes: 10,
        })
      })

      expect(result.current.isLockValid()).toBe(true)
    })

    it('should return false when lock is expired', () => {
      const { result } = renderCheckoutHook()
      
      vi.setSystemTime(new Date('2024-01-01T12:15:00Z'))

      act(() => {
        result.current.setLockState({
          lockToken: 'abc123',
          expiresAt: '2024-01-01T12:10:00Z', // 5 minutes ago
          timeoutMinutes: 10,
        })
      })

      expect(result.current.isLockValid()).toBe(false)
    })
  })

  describe('getTimeRemaining', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return 0 when no lock state', () => {
      const { result } = renderCheckoutHook()
      
      expect(result.current.getTimeRemaining()).toBe(0)
    })

    it('should return remaining seconds', () => {
      const { result } = renderCheckoutHook()
      
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

      act(() => {
        result.current.setLockState({
          lockToken: 'abc123',
          expiresAt: '2024-01-01T12:10:00Z', // 10 minutes from now
          timeoutMinutes: 10,
        })
      })

      expect(result.current.getTimeRemaining()).toBe(600) // 10 minutes = 600 seconds
    })

    it('should return 0 when lock has expired', () => {
      const { result } = renderCheckoutHook()
      
      vi.setSystemTime(new Date('2024-01-01T12:15:00Z'))

      act(() => {
        result.current.setLockState({
          lockToken: 'abc123',
          expiresAt: '2024-01-01T12:10:00Z', // 5 minutes ago
          timeoutMinutes: 10,
        })
      })

      expect(result.current.getTimeRemaining()).toBe(0)
    })
  })

  describe('Provider', () => {
    it('should render children', () => {
      render(
        <CheckoutProvider>
          <div data-testid="child">Test Child</div>
        </CheckoutProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })
})
