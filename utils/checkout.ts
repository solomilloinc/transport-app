import { ReserveSummaryItem } from '@/interfaces/reserve';

export interface CheckoutPassengerData {
  firstName: string;
  lastName: string;
  passengerType?: string;
  email?: string;
  phone: string;
  documentNumber: string;
  specialRequests?: string;
}

export interface CheckoutLocationSelection {
  pickupDirectionId: number | null;
  dropoffCityId: number | null;
  dropoffCityName: string | null;
  dropoffDirectionId: number | null;
  dropoffPrice: number;
}

export interface CheckoutPayloadItem {
  reserveId: number;
  reserveTypeId: number;
  customerId: null;
  isPayment: true;
  pickupLocationId: number | null;
  dropoffLocationId: number | null;
  dropoffCityId?: number | null;
  hasTraveled: false;
  price: number;
  firstName: string;
  lastName: string;
  email: string;
  phone1: string;
  documentNumber: string;
}

export interface PersistedCheckoutState {
  outboundTrip: ReserveSummaryItem | null;
  returnTrip?: ReserveSummaryItem | null;
  passengers: number;
  lockState?: {
    lockToken: string;
    expiresAt: string;
    timeoutMinutes: number;
  } | null;
}

const STORAGE_KEY = 'transport.checkout.v1';
const DRAFT_STORAGE_KEY = 'transport.checkout.draft.v1';

export type CheckoutStep = 'passengers' | 'payment' | 'review';

export interface PersistedCheckoutDraft {
  outboundReserveId: number;
  returnReserveId: number | null;
  currentStep: CheckoutStep;
  passengerData: CheckoutPassengerData[];
  paymentMethod: 'card' | 'wallet';
  outboundLocation: CheckoutLocationSelection;
  returnLocation: CheckoutLocationSelection;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function loadCheckoutFromStorage(): PersistedCheckoutState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedCheckoutState;

    if (!parsed || !parsed.outboundTrip || !parsed.passengers) {
      return null;
    }

    if (
      parsed.lockState?.expiresAt &&
      new Date(parsed.lockState.expiresAt).getTime() <= Date.now()
    ) {
      parsed.lockState = null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveCheckoutToStorage(state: PersistedCheckoutState): void {
  if (typeof window === 'undefined') return;

  if (!state.outboundTrip) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearCheckoutFromStorage(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function loadCheckoutDraftFromStorage(): PersistedCheckoutDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedCheckoutDraft;
  } catch {
    return null;
  }
}

export function saveCheckoutDraftToStorage(draft: PersistedCheckoutDraft): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearCheckoutDraftFromStorage(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function validatePassengerData(
  passengers: CheckoutPassengerData[],
  expectedCount: number
): string | null {
  if (passengers.length !== expectedCount) {
    return 'Debe completar los datos de todos los pasajeros.';
  }

  for (const passenger of passengers) {
    if (!passenger.firstName?.trim() || !passenger.lastName?.trim() || !passenger.documentNumber?.trim()) {
      return 'Nombre, apellido y documento son obligatorios para todos los pasajeros.';
    }

    if (!passenger.phone?.trim()) {
      return 'El telefono es obligatorio para todos los pasajeros.';
    }

    if (passenger.email?.trim() && !EMAIL_REGEX.test(passenger.email.trim())) {
      return 'Hay un email con formato invalido.';
    }
  }

  return null;
}

export function getEffectiveTripPrice(
  selectedDropoffPrice: number,
  defaultTripPrice: number
): number {
  return selectedDropoffPrice > 0 ? selectedDropoffPrice : defaultTripPrice;
}

function buildSegmentItems(
  passengers: CheckoutPassengerData[],
  trip: ReserveSummaryItem | null | undefined,
  location: CheckoutLocationSelection,
  reserveTypeId: number,
  unitPrice: number
): CheckoutPayloadItem[] {
  if (!trip) return [];

  return passengers.map((passenger) => ({
    reserveId: trip.ReserveId,
    reserveTypeId,
    customerId: null,
    isPayment: true,
    pickupLocationId: location.pickupDirectionId,
    dropoffLocationId: location.dropoffDirectionId,
    dropoffCityId: location.dropoffCityId,
    hasTraveled: false,
    price: Number(unitPrice.toFixed(2)),
    firstName: passenger.firstName.trim(),
    lastName: passenger.lastName.trim(),
    email: passenger.email?.trim() ?? '',
    phone1: passenger.phone.trim(),
    documentNumber: passenger.documentNumber.trim(),
  }));
}

export function buildReservePayloadItems(params: {
  passengers: CheckoutPassengerData[];
  outboundTrip: ReserveSummaryItem;
  returnTrip?: ReserveSummaryItem | null;
  outboundLocation: CheckoutLocationSelection;
  returnLocation: CheckoutLocationSelection;
  outboundPrice: number;
  returnPrice: number;
}): CheckoutPayloadItem[] {
  const {
    passengers,
    outboundTrip,
    returnTrip,
    outboundLocation,
    returnLocation,
    outboundPrice,
    returnPrice,
  } = params;

  const items = buildSegmentItems(passengers, outboundTrip, outboundLocation, returnTrip ? 2 : 1, outboundPrice);

  if (returnTrip) {
    items.push(...buildSegmentItems(passengers, returnTrip, returnLocation, 2, returnPrice));
  }

  return items;
}
