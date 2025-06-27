export interface Payment {
    TransactionAmount: number,
    PaymentMethod: number
}

export const emptyPaymentCreate = {
    TransactionAmount: 0.00,
    PaymentMethod:0
}

export enum PaymentMethod {
   Efectivo = 1,
   Online = 2,
   Tarjeta = 3,
   Transferencia = 4
}