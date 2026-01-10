import { PagedResponse } from "@/services/types"

export enum TransactionType {
    Charge = 1,
    Payment = 2,
    Adjustment = 3,
    Refund = 4
}

export const TransactionTypeLabels: Record<string, string> = {
    'Charge': 'Cargo',
    'Payment': 'Pago',
    'Adjustment': 'Ajuste',
    'Refund': 'Reembolso'
}

export const TransactionTypeOptions = [
    { value: '', label: 'Todos' },
    { value: TransactionType.Charge.toString(), label: 'Cargo' },
    { value: TransactionType.Payment.toString(), label: 'Pago' },
    { value: TransactionType.Adjustment.toString(), label: 'Ajuste' },
    { value: TransactionType.Refund.toString(), label: 'Reembolso' }
]

export interface Transaction {
    Id: number
    CustomerId: number
    Description: string
    TransactionType: string
    Amount: number
    Date: string
}

export interface CustomerAccountSummary {
    CustomerId: number
    CustomerFullName: string
    CurrentBalance: number
    Transactions: PagedResponse<Transaction>
}

export interface CustomerAccountFilter {
    TransactionType?: number
    FromDate?: string
    ToDate?: string
}
