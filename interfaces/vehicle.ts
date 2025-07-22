// Define the Vehicle interface
export interface Vehicle {
    VehicleId: number;
    VehicleTypeId: number;
    VehicleTypeName: string;
    InternalNumber: string;
    VehicleTypeQuantity: number;
    AvailableQuantity: number;
    Status: string;
  }

export const emptyVehicle = {
  vehicleTypeId: 0,
  internalNumber: '',
  availableQuantity: 0
}