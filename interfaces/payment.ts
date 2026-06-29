export interface Payment {
  transactionAmount: number;
  paymentMethod: number;
}

export const emptyPaymentCreate: Payment = {
  transactionAmount: 0.0,
  paymentMethod: 0,
};

export enum PaymentMethod {
  Efectivo = 1,
  Online = 2,
  Tarjeta = 3,
  Transferencia = 4,
  AccountCredit = 5,
}

export interface PassengerPaymentCreate {
  transactionAmount: number;
  paymentMethod: number;
}

export interface ReservePaymentsCreateRequest {
  payments: PassengerPaymentCreate[];
  creditAmount: number;
}
