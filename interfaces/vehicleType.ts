export interface VehicleType {
  vehicleTypeId: number;
  name: string;
  imageBase64: string;
  quantity: number;
  status: string;
}

export const emptyVehicleType: VehicleType = {
  vehicleTypeId: 0,
  name: '',
  imageBase64: '',
  quantity: 0,
  status: 'active',
};
