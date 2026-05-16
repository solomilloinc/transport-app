export interface CustomerServiceDto {
  serviceId: number;
  serviceName: string;
}

export interface Passenger {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone1: string;
  phone2: string;
  documentNumber: string;
  status: string;
  serviceIds?: number[];
  services?: CustomerServiceDto[];
}

export const emptyPassenger: Omit<Passenger, 'customerId'> = {
  firstName: '',
  lastName: '',
  email: '',
  documentNumber: '',
  phone1: '',
  phone2: '',
  status: 'Activo',
  serviceIds: [],
};
