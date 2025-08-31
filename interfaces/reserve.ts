import { Auditable } from "./auditable";
import { PassengerReserve } from "./passengerReserve";
import { ReservePrice } from "./reservePrice";

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
    ReserveId:number;
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
}

export const emptyEditReserve ={
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
}

export interface CreateReserveExternalResult{
    status: string | null;
    preferenceId: string | null;
}
