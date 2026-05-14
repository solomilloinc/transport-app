import { PaymentMethodSummary } from './reserve';

export default interface CashBox {
  cashBoxId: number;
  description: string;
  openedAt: string;
  closedAt: string;
  status: string;
  openedByUserEmail: string;
  closedByUserEmail: string;
  reserveId: number;
  totalPayments: number;
  totalAmount: number;
  paymentsByMethod: PaymentMethodSummary[];
}
