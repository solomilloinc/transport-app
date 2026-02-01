// For customer report services (from API response)
export interface CustomerServiceDto {
  ServiceId: number;
  ServiceName: string;
}

export interface Passenger {
  CustomerId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone1: string;
  Phone2: string;
  DocumentNumber: string;
  Status: string;
  ServiceIds?: number[];
  Services?: CustomerServiceDto[];
}

export const emptyPassenger: Omit<Passenger, 'CustomerId'> = {
  FirstName: '',
  LastName: '',
  Email: '',
  DocumentNumber: '',
  Phone1: '',
  Phone2: '',
  Status: 'Activo',
  ServiceIds: []
}