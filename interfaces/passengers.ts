export interface Passenger {
    CustomerId: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Phone1: string;
    Phone2: string;
    DocumentNumber: string;
    Status: string;
}

export const emptyPassenger:Omit<Passenger, 'CustomerId'> = {
    FirstName: '',
  LastName: '',
  Email: '',
  DocumentNumber: '',
  Phone1: '',
  Phone2: '',
  Status: 'Activo'
}