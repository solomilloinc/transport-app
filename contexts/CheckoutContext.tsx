'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

const CHECKOUT_STORAGE_KEY = 'checkout_state';
const defaultState: CheckoutState = { outboundTrip: null, returnTrip: null, passengers: 1 };

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [checkout, setCheckoutState] = useState<CheckoutState>(defaultState);

  // Inicializar desde localStorage, pero sin bloquear el render
  useEffect(() => {
    const storedState = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (storedState) {
      try {
        setCheckoutState(JSON.parse(storedState));
      } catch (error) {
        console.error("Error parsing stored checkout state:", error);
      }
    }
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkout));
  }, [checkout]);

  const setCheckout = (state: CheckoutState) => setCheckoutState(state);
  const clearCheckout = () => setCheckoutState(defaultState);

  return (
    <CheckoutContext.Provider value={{ checkout, setCheckout, clearCheckout }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => useContext(CheckoutContext);
