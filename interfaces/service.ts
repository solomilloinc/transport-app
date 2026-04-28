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

/**
 * Create-form baseline. `StartDay` / `EndDay` start as `null` so the
 * `required` validator catches users who leave them untouched — if
 * they were `0`, the validator would accept "Domingo" silently.
 * They are coerced to number before submitting.
 */
export const emptyService = {
  Name: "",
  TripId: 0,
  EstimatedDuration: "01:00",
  VehicleId: 0,
  StartDay: null as number | null,
  EndDay: null as number | null,
  Schedules: [] as ServiceSchedule[], // For form usage — populated by SchedulesEditor (buffered)
  Schedulers: [emptyServiceSchedule], // From API response
  Status: 'Activo',
  AllowedDirections: [] as ServiceDirection[], // Allowed directions from API
  AllowedDirectionIds: [] as number[], // For form submission
}