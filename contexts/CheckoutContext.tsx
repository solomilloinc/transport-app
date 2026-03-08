import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ReserveSummaryItem } from '@/interfaces/reserve';

const STORAGE_KEY = 'transport-checkout-state';

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
  isHydrated: boolean;
}

const defaultState: CheckoutState = { outboundTrip: null, returnTrip: null, passengers: 1 };

const CheckoutContext = createContext<CheckoutContextProps>({
  checkout: defaultState,
  setCheckout: () => {},
  setLockState: () => {},
  clearCheckout: () => {},
  isLockValid: () => false,
  getTimeRemaining: () => 0,
  isHydrated: false,
});

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [checkout, setCheckoutState] = useState<CheckoutState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validar si el lock no ha expirado hace demasiado tiempo (ej: 1 hora)
        if (parsed.lockState?.expiresAt) {
          const expiryDate = new Date(parsed.lockState.expiresAt);
          const now = new Date();
          // Si expiró hace más de 1 hora, mejor no cargar el lock
          if (now.getTime() - expiryDate.getTime() > 3600000) {
            delete parsed.lockState;
          }
        }
        setCheckoutState(parsed);
      } catch (e) {
        console.error('Error loading checkout state', e);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkout));
    }
  }, [checkout, isHydrated]);

  const setCheckout = (state: CheckoutState) => setCheckoutState(state);

  const setLockState = (lockState: LockState | null) => {
    setCheckoutState(prev => ({ ...prev, lockState }));
  };

  const clearCheckout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCheckoutState(defaultState);
  };

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
      getTimeRemaining,
      isHydrated
    }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => useContext(CheckoutContext);
