import { PaymentMethodSummary } from "./reserve";

export default interface CashBox {
    CashBoxId: number,
    Description: string,
    OpenedAt: string,
    ClosedAt: string,
    Status: string,
    OpenedByUserEmail: string,
    ClosedByUserEmail: string,
    ReserveId: number,
    TotalPayments: number,
    TotalAmount: number,
    PaymentsByMethod: PaymentMethodSummary[];
}