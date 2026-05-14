import { TripPrice, CityDirectionsDto } from './trip';
import { Auditable } from './auditable';
import { PassengerReserve } from './passengerReserve';

export enum ReserveStatusEnum {
  Available = 0,
  Confirmed = 1,
  Cancelled = 2,
  Completed = 3,
  Rejected = 4,
  Expired = 5,
}

export interface Reserve extends Auditable {
  passengersReserve: PassengerReserve[];
}

export interface ReserveReport {
  reserveId: number;
  tripId: number;
  serviceId: number;
  reserveDate: string;
  originCityId: number;
  originName: string;
  destinationCityId: number;
  destinationName: string;
  departureHour: string;
  vehicleId: number;
  driverId: number;
  vehicleName: string;
  driverName: string;
  availableQuantity: number;
  reservedQuantity: number;
  prices: TripPrice[];
  relevantCities: CityDirectionsDto[];
  status: number;
}

export const emptyEditReserve = {
  vehicleId: 0,
  driverId: 0,
  departureHour: '',
};

export interface ReserveStopScheduleDto {
  directionId: number;
  directionName: string;
  order: number;
  pickupTime: string;
}

export interface ReserveSummaryItem {
  reserveId: number;
  tripId: number;
  originName: string;
  destinationName: string;
  departureHour: string;
  departureDate: string;
  price: number;
  availableQuantity: number;
  vehicleName: string;
  estimatedDuration: string;
  arrivalHour: string;
  stopSchedules: ReserveStopScheduleDto[] | null;
}

export interface CreateReserveExternalResult {
  status: string;
  preferenceId: string | null;
}

export interface ReserveUpdate {
  vehicleId?: number | null;
  driverId?: number | null;
  reserveDate?: string | null;
  departureHour?: string | null;
  status: number;
}

export interface PaymentMethodSummary {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
}

export interface ReservePaymentSummary {
  reserveId: number;
  cashBoxId: number;
  paymentsByMethod: PaymentMethodSummary[];
  totalAmount: number;
}
