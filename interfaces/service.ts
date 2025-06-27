import { emptyServiceSchedule, ServiceSchedule } from "./serviceSchedule";
import { Vehicle } from "./vehicle";

// Define the Vehicle interface
export interface Service {
  ServiceId: number;
  Name: string;
  OriginId: number;
  OriginName: string;
  DestinationId: number;
  DestinationName: string;
  EstimatedDuration: string;
  StartDay: number,
  EndDay: number,
  Schedules: ServiceSchedule[];
  Vehicle: Vehicle
  Status: string;
}

export const emptyService = {
  Name: "",
  OriginId: 0,
  DestinationId: 0,
  EstimatedDuration: "",
  VehicleId: 0,
  StartDay: 0,
  EndDay: 0,
  Schedules: [emptyServiceSchedule],
  Status: 'Activo'
}