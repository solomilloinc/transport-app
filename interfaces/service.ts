import { emptyServiceSchedule, ServiceSchedule } from "./serviceSchedule";
import { Vehicle } from "./vehicle";

// Direction allowed for a service
export interface ServiceDirection {
  DirectionId: number;
  Name: string;
  CityId: number;
}

// Define the Service interface
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
  AllowedDirections: ServiceDirection[]; // Allowed directions from API
  AllowedDirectionIds?: number[]; // For form submission
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
  AllowedDirections: [] as ServiceDirection[], // Allowed directions from API
  AllowedDirectionIds: [] as number[], // For form submission
}