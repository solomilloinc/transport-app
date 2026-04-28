import { AlertTriangle } from 'lucide-react';
import { ReserveQuoteDiscountLost } from '@/interfaces/quote';

interface QuoteWarningBannerProps {
  discountsLost: ReserveQuoteDiscountLost[];
}

export function QuoteWarningBanner({ discountsLost }: QuoteWarningBannerProps) {
  if (!discountsLost || discountsLost.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          {discountsLost.map((d, i) => (
            <p key={`${d.code}-${i}`} className="text-sm text-yellow-800">
              {d.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
