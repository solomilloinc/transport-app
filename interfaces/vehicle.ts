export interface Vehicle {
  vehicleId: number;
  vehicleTypeId: number;
  vehicleTypeName: string;
  internalNumber: string;
  vehicleTypeQuantity: number;
  availableQuantity: number;
  status: string;
}

export const emptyVehicle = {
  vehicleTypeId: 0,
  internalNumber: '',
  availableQuantity: 0,
};
