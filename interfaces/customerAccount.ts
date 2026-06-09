import { PagedResponse } from '@/services/types';

export enum TransactionType {
  Charge = 1,
  Payment = 2,
  Adjustment = 3,
  Refund = 4,
}

export const TransactionTypeLabels: Record<string, string> = {
  Charge: 'Cargo',
  Payment: 'Pago',
  Adjustment: 'Ajuste',
  Refund: 'Reembolso',
};

export const TransactionTypeOptions = [
  { value: '', label: 'Todos' },
  { value: TransactionType.Charge.toString(), label: 'Cargo' },
  { value: TransactionType.Payment.toString(), label: 'Pago' },
  { value: TransactionType.Adjustment.toString(), label: 'Ajuste' },
  { value: TransactionType.Refund.toString(), label: 'Reembolso' },
];

export interface Transaction {
  id: number;
  customerId: number;
  description: string;
  transactionType: string;
  amount: number;
  date: string;
}

export interface CustomerAccountSummary {
  customerId: number;
  customerFullName: string;
  currentBalance: number;
  rangeTotalPagos: number;
  rangeTotalCargos: number;
  transactions: PagedResponse<Transaction>;
}

export interface CustomerAccountFilter {
  transactionType?: number;
  fromDate?: string;
  toDate?: string;
}

export interface CustomerDebtSettleRequest {
  customerId: number;
  reserveIds: number[];
  payments: { transactionAmount: number; paymentMethod: number }[];
}

export interface PendingReservePassenger {
  passengerId: number;
  fullName: string;
  price: number;
  status: number;
}

export interface PendingReserve {
  reserveId: number;
  reserveDate: string;
  originName: string;
  destinationName: string;
  departureHour: string;
  totalPrice: number;
  totalPaid: number;
  pendingDebt: number;
  passengers: PendingReservePassenger[];
}
