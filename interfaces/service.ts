import { emptyServiceSchedule, ServiceSchedule } from "./serviceSchedule";
import { Vehicle } from "./vehicle";

// Define the Vehicle interface
export interface Service {
  ServiceId: number;
  Name: string;
  TripId: number;
  TripName?: string;
  EstimatedDuration: string;
  StartDay: number,
  EndDay: number,
  Schedules?: ServiceSchedule[]; // For form usage (optional)
  Schedulers: ServiceSchedule[]; // From API response
  Vehicle: Vehicle
  Status: string;
  AllowedDirectionIds?: number[]; // Whitelist of allowed directions
}

export const emptyService = {
  Name: "",
  TripId: 0,
  EstimatedDuration: "01:00",
  VehicleId: 0,
  StartDay: 0,
  EndDay: 0,
  Schedules: [emptyServiceSchedule], // For form usage
  Schedulers: [emptyServiceSchedule], // For API response
  Status: 'Activo',
  AllowedDirectionIds: [] as number[], // Whitelist of allowed directions
}