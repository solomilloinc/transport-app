import { Auditable } from "./auditable"
import { Payment } from "./payment"

export interface PassengerReserve extends Auditable {
    PassengerId: number
    ReserveId: number
    CustomerId: number
    IsPayment: boolean
    StatusPaymentId: number
    ReserveTypeId: number
    PaymentMethod: number
    PaymentMethods: string
    PickupLocationId: number
    DropoffLocationId: number
    HasTraveled: boolean
    Status: string
    IsRoundTrip: boolean
    Payments: Payment[]
    PaidAmount: number
}

export interface PassengerReserveCreate extends Omit<PassengerReserve, 'CustomerReserveId' | 'IsRoundTrip' | 'Payments' | 'Status' | 'CreatedBy' | 'CreatedDate' | 'UpdatedBy' | 'UpdatedDate'> {
    ReserveId: number
    CustomerId: number
    IsPayment: boolean
    StatusPaymentId: number
    ReserveTypeId: number
    PaymentMethods: string
    PaidAmount: number
    PickupLocationId: number
    DropoffLocationId: number
    PickupLocationReturnId?: number
    DropoffLocationReturnId?: number
    HasTraveled: boolean
}

export const emptyPassengerCreate: Omit<PassengerReserveCreate, 'PaidAmount' | 'PaymentMethods' | 'HasTraveled'> = {
    PassengerId: 0,
    ReserveId: 0,
    CustomerId: 0,
    PickupLocationId: 0,
    DropoffLocationId: 0,
    IsPayment: true,
    StatusPaymentId: 1, // Assuming 1 means paid
    PaymentMethod: 1, // Assuming 1 is cash
    ReserveTypeId: 1
}

export interface PassengerReserveReport extends PassengerReserve {
    FullName: string
    DocumentNumber: string
    PickupLocationName: string
    DropoffLocaationName: string
    CurrentBalance: number
}

export interface PassengerReserveUpdate {
    pickupLocationId: number
    dropoffLocationId: number
    hasTraveled: boolean
}
