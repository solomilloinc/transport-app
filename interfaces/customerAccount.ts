import { PagedResponse } from "@/services/types"

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
