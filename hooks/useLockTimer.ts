import { useState, useEffect, useRef } from 'react';

interface UseLockTimerProps {
  lockToken?: string | null;
  expiresAt?: string | null;
  onExpire?: () => void;
}

interface UseLockTimerReturn {
  timeRemaining: number;
  isExpired: boolean;
  formattedTime: string;
}

export const useLockTimer = ({
  lockToken,
  expiresAt,
  onExpire
}: UseLockTimerProps): UseLockTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para formatear el tiempo en MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Limpiar interval anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Si no hay token o fecha de expiración, resetear
    if (!lockToken || !expiresAt) {
      setTimeRemaining(0);
      return;
    }

    // Función para calcular tiempo restante
    const calculateRemaining = (): number => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    // Calcular tiempo inicial
    const initialRemaining = calculateRemaining();
    setTimeRemaining(initialRemaining);

    // Si ya expiró, llamar callback y no crear interval
    if (initialRemaining <= 0) {
      onExpire?.();
      return;
    }

    // Crear interval para actualizar cada segundo
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      // Si expira, limpiar interval y llamar callback
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onExpire?.();
      }
    }, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lockToken, expiresAt, onExpire]);

  return {
    timeRemaining,
    isExpired: timeRemaining <= 0 && !!(lockToken && expiresAt),
    formattedTime: formatTime(timeRemaining),
  };
};