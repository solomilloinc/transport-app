import { Auditable } from "./auditable";
import { PassengerReserve } from "./passengerReserve";
import { ReservePrice } from "./reservePrice";

export enum ReserveStatusEnum {
    Available = 0,
    Confirmed = 1,
    Cancelled = 2,
    Completed = 3,
    Rejected = 4,
    Expired = 5
}

export interface Reserve extends Auditable {
    ReserveId: number;
    ReserveDate: string;
    VehicleId: number;
    DriverId: number;
    ServiceId: number;
    UserId: number;
    Status: string;
    PassengersReserve: PassengerReserve[];

}

export interface ReserveReport {
    ReserveId: number;
    ReserveDate: string;
    OriginName: string;
    DestinationName: string;
    DepartureHour: string;
    VehicleId: number;
    DriverId: number;
    VehicleName: string;
    DriverName: string;
    AvailableQuantity: number;
    ReservedQuantity: number;
    Prices: ReservePrice[];
    Status: number;
}

export const emptyEditReserve = {
    VehicleId: 0,
    DriverId: 0,
    DepartureHour: ''
}

export interface ReserveSummaryItem {
    ReserveId: number;
    OriginName: string;
    DestinationName: string;
    DepartureHour: string;
    DepartureDate: string;
    Price: number;
    AvailableQuantity: number;
    VehicleName: string;
    EstimatedDuration: string;
    ArrivalHour: string;
}

export interface CreateReserveExternalResult {
    Status: string;
    PreferenceId: string | null;
}

export interface ReserveUpdate {
    vehicleId: number;
    driverId: number;
    reserveDate: string;
    departureHour: string;
    status: number;
}

export interface PaymentMethodSummary {
    paymentMethodId: number;
    paymentMethodName: string;
    amount: number;
}

export interface ReservePaymentSummary {
    reserveId: number;
    paymentsByMethod: PaymentMethodSummary[];
    totalAmount: number;
}
