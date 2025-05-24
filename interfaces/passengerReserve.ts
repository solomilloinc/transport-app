import { Auditable } from "./auditable"

export interface PassengerReserve extends Auditable {
    CustomerReserveId: number
    ReserveId: number
    CustomerId: number
    IsPayment: boolean
    StatusPayment: number
    PaymentMethod: number
    Price: number
    PickupLocationId: number
    DropoffLocationId: number
    HasTraveled: boolean
    Status: string
}

export interface PassengerReserveReport extends PassengerReserve {
    FullName: string
    DocumentNumber: string
}
