import { Payment } from "@/interfaces/payment";

export const DUPLICATE_PAYMENT_METHOD_MESSAGE = "Ya existe un pago con este método. Elimínalo antes de agregar otro.";

export function hasDuplicatePaymentMethods(payments: Payment[]): boolean {
  const seen = new Set<number>();
  for (const payment of payments) {
    if (seen.has(payment.PaymentMethod)) return true;
    seen.add(payment.PaymentMethod);
  }
  return false;
}
