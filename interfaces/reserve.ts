import { Auditable } from "./auditable";
import { PassengerReserve } from "./passengerReserve";

export interface Reserve extends Auditable {
    ReserveId: number;
    ReserveDate: string;
    VehicleId: number;
    DriverId: string;
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
    AvailableQuantity: number;
    ReservedQuantity: number;
}