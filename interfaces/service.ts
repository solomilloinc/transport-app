import { ServiceSchedule } from "./serviceSchedule";

// Define the Vehicle interface
export interface Service {
  ServiceId: number;
  Name: string;
  OriginId: number;
  OriginName: string;
  DestinationId: number;
  DestinationName: string;
  EstimatedDuration: string;
  Schedules: ServiceSchedule[];
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