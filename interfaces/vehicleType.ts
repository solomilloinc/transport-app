export interface VehicleType {
    VehicleTypeId: number;
    Name: string;
    ImageBase64: string;
    Quantity: number;
    status: string;
  }
export const emptyVehicleType: VehicleType = {
    VehicleTypeId: 0,
    Name: '',
    ImageBase64: '',
    Quantity: 0,
    status: 'active'
  };