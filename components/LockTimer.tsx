'use client';

import { Clock } from 'lucide-react';
import { useLockTimer } from '@/hooks/useLockTimer';

interface LockTimerProps {
  lockToken?: string | null;
  expiresAt?: string | null;
  onExpire?: () => void;
  onRestart?: () => void;
}

export const LockTimer = ({ lockToken, expiresAt, onExpire, onRestart }: LockTimerProps) => {
  const { timeRemaining, isExpired, formattedTime } = useLockTimer({
    lockToken,
    expiresAt,
    onExpire
  });

  if (!lockToken || !expiresAt) return null;

  if (isExpired || timeRemaining <= 0) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-red-600">
            Su reserva ha expirado. Por favor, inicie el proceso nuevamente.
          </div>
          <button
            onClick={() => {
              onRestart?.();
            }}
            className="ml-4 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Reiniciar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-orange-600 mr-2" />
          <span className="text-sm font-medium text-orange-800">
            Tiempo restante para completar su reserva:
          </span>
        </div>
        <span className="font-mono text-lg font-bold text-orange-600">
          {formattedTime}
        </span>
      </div>
    </div>
  );
};