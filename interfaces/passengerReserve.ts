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
    PaymentMethodName: string
    Price: number
    PickupLocationId: number
    DropoffLocationId: number
    HasTraveled: boolean
    Status: string
    IsRoundTrip: boolean
    Payments: Payment[]
}

export interface PassengerReserveCreate extends Omit<PassengerReserve, 'CustomerReserveId' | 'IsRoundTrip' |'PaymentMethodName' | 'Payments' | 'Status' | 'CreatedBy' | 'CreatedDate' | 'UpdatedBy' | 'UpdatedDate'> {
    ReserveId: number
    CustomerId: number
    IsPayment: boolean
    StatusPaymentId: number
    ReserveTypeId: number
    PaymentMethod: number
    Price: number
    PickupLocationId: number
    DropoffLocationId: number
    PickupLocationReturnId?: number
    DropoffLocationReturnId?: number
    HasTraveled: boolean
}

export const emptyPassengerCreate: PassengerReserveCreate = {
  PassengerId: 0,
  ReserveId: 0,
  CustomerId: 0,
  PickupLocationId: 0,
  DropoffLocationId: 0,
  IsPayment: true,
  StatusPaymentId: 1, // Assuming 1 means paid
  PaymentMethod: 1, // Assuming 1 is cash
  Price: 650,
  ReserveTypeId: 1,
  HasTraveled: true,
}

export interface PassengerReserveReport extends PassengerReserve {
    FullName: string
    DocumentNumber: string
    PickupLocationName: string
    DropoffLocaationName: string
    CurrentBalance: number
}
