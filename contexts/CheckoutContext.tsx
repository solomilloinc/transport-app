'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ReserveSummaryItem } from '@/interfaces/reserve';

export interface CheckoutState {
  outboundTrip: ReserveSummaryItem | null;
  returnTrip?: ReserveSummaryItem | null;
  passengers: number;
}

interface CheckoutContextProps {
  checkout: CheckoutState;
  setCheckout: (state: CheckoutState) => void;
  clearCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextProps>({
  checkout: { outboundTrip: null, passengers: 1 },
  setCheckout: () => {},
  clearCheckout: () => {},
});

const defaultState: CheckoutState = { outboundTrip: null, returnTrip: null, passengers: 1 };

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [checkout, setCheckoutState] = useState<CheckoutState>(defaultState);

  const setCheckout = (state: CheckoutState) => setCheckoutState(state);
  const clearCheckout = () => setCheckoutState(defaultState);

  return (
    <CheckoutContext.Provider value={{ checkout, setCheckout, clearCheckout }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => useContext(CheckoutContext);
