export interface Driver {
  driverId: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  status: string;
}

export const emptyDriver = {
  firstName: '',
  lastName: '',
  documentNumber: '',
};
