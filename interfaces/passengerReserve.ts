import { Auditable } from "./auditable"

export interface PassengerReserve extends Auditable {
    CustomerReserveId: number
    ReserveId: number
    CustomerId: number
    IsPayment: boolean
    StatusPaymentId: number
    ReserveTypeId: number
    PaymentMethod: number
    Price: number
    PickupLocationId: number
    DropoffLocationId: number
    HasTraveled: boolean
    Status: string
    IsRoundTrip: boolean
}

export interface PassengerReserveCreate extends Omit<PassengerReserve, 'CustomerReserveId' | 'IsRoundTrip' | 'Status' | 'CreatedBy' | 'CreatedDate' | 'UpdatedBy' | 'UpdatedDate'> {
    ReserveId: number
    CustomerId: number
    IsPayment: boolean
    StatusPaymentId: number
    ReserveTypeId: number
    PaymentMethod: number
    Price: number
    PickupLocationId: number
    DropoffLocationId: number
    HasTraveled: boolean
}

export interface PassengerReserveReport extends PassengerReserve {
    FullName: string
    DocumentNumber: string
}
