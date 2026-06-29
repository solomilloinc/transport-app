export interface Passenger {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone1: string;
  phone2: string;
  documentNumber: string;
  status: string;
  currentBalance?: number;
  /**
   * Cliente abonado: viaja bajo un acuerdo especial y NO se le cobra al crearle
   * una reserva desde el admin (sin pagos, sin cuenta corriente, sin caja). Ver
   * CONTEXT.md. El backend lo agrega en `customer-report`; mientras no esté live
   * puede venir `undefined`, por eso se lee defensivamente (`=== true`).
   */
  hasAbono?: boolean;
}

export const emptyPassenger: Omit<Passenger, 'customerId'> = {
  firstName: '',
  lastName: '',
  email: '',
  documentNumber: '',
  phone1: '',
  phone2: '',
  status: 'Activo',
  hasAbono: false,
};
