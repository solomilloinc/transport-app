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
  Schedules?: ServiceSchedule[]; // For form usage (optional)
  Schedulers: ServiceSchedule[]; // From API response
  Vehicle: Vehicle
  Status: string;
}

export const emptyService = {
  Name: "",
  OriginId: 0,
  DestinationId: 0,
  EstimatedDuration: "01:00",
  VehicleId: 0,
  StartDay: 0,
  EndDay: 0,
  Schedules: [emptyServiceSchedule], // For form usage
  Schedulers: [emptyServiceSchedule], // For API response
  Status: 'Activo'
}