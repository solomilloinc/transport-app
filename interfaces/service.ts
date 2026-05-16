import { emptyServiceSchedule, ServiceSchedule } from './serviceSchedule';
import { Vehicle } from './vehicle';

export interface ServiceDirection {
  directionId: number;
  name: string;
  cityId: number;
}

export interface Service {
  serviceId: number;
  name: string;
  tripId: number;
  tripName?: string;
  estimatedDuration: string;
  startDay: number;
  endDay: number;
  schedules?: ServiceSchedule[]; // form usage
  schedulers: ServiceSchedule[]; // API response
  vehicle: Vehicle;
  status: string;
  allowedDirections: ServiceDirection[];
  allowedDirectionIds?: number[];
}

export const emptyService = {
  name: '',
  tripId: 0,
  estimatedDuration: '01:00',
  vehicleId: 0,
  startDay: 0,
  endDay: 0,
  schedules: [emptyServiceSchedule],
  schedulers: [emptyServiceSchedule],
  status: 'Activo',
  allowedDirections: [] as ServiceDirection[],
  allowedDirectionIds: [] as number[],
};
