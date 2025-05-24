// Define the Vehicle interface
export interface Service {
  ServiceId: 0;
  Name: string;
  OriginId: number;
  OriginName: string;
  DestinationId: number;
  DestinationName: string;
  StartDay: string;
  EndDay: string;
  EstimatedDuration: string;
  DepartureHour: string;
  IsHoliday: true;
  Vehicle: {
    internalNumber: string;
    availableQuantity: 0;
    fullQuantity: 0;
    vehicleTypeName: string;
    image: string;
    VehicleId: number;
  };
  Status: string;
}