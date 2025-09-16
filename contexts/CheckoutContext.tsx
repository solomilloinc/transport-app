'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ReserveSummaryItem } from '@/interfaces/reserve';

export interface LockState {
  lockToken: string;
  expiresAt: string; // ISO date string
  timeoutMinutes: number;
}

export interface CheckoutState {
  outboundTrip: ReserveSummaryItem | null;
  returnTrip?: ReserveSummaryItem | null;
  passengers: number;
  lockState?: LockState | null;
}

interface CheckoutContextProps {
  checkout: CheckoutState;
  setCheckout: (state: CheckoutState) => void;
  setLockState: (lockState: LockState | null) => void;
  clearCheckout: () => void;
  isLockValid: () => boolean;
  getTimeRemaining: () => number;
}

const CheckoutContext = createContext<CheckoutContextProps>({
  checkout: { outboundTrip: null, passengers: 1 },
  setCheckout: () => {},
  setLockState: () => {},
  clearCheckout: () => {},
  isLockValid: () => false,
  getTimeRemaining: () => 0,
});

const defaultState: CheckoutState = { outboundTrip: null, returnTrip: null, passengers: 1 };

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [checkout, setCheckoutState] = useState<CheckoutState>(defaultState);

  const setCheckout = (state: CheckoutState) => setCheckoutState(state);

  const setLockState = (lockState: LockState | null) => {
    setCheckoutState(prev => ({ ...prev, lockState }));
  };

  const clearCheckout = () => setCheckoutState(defaultState);

  const isLockValid = () => {
    if (!checkout.lockState) return false;
    return new Date() < new Date(checkout.lockState.expiresAt);
  };

  const getTimeRemaining = () => {
    if (!checkout.lockState) return 0;
    const now = new Date().getTime();
    const expiry = new Date(checkout.lockState.expiresAt).getTime();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  };

  return (
    <CheckoutContext.Provider value={{
      checkout,
      setCheckout,
      setLockState,
      clearCheckout,
      isLockValid,
      getTimeRemaining
    }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => useContext(CheckoutContext);
