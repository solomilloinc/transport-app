export interface TripPrice {
  tripPriceId: number;
  tripId: number;
  cityId: number;
  cityName: string;
  directionId: number | null;
  directionName: string | null;
  reserveTypeId: number;
  reserveTypeName: string;
  price: number;
  order: number;
  status: string;
}

export interface CityDirectionItem {
  directionId: number;
  name: string;
}

export interface CityDirectionsDto {
  cityId: number;
  name: string;
  directions: CityDirectionItem[];
}

export interface TripPickupStopReportDto {
  tripPickupStopId: number;
  directionId: number;
  directionName: string;
  cityId: number;
  cityName: string;
  order: number;
  pickupTimeOffset: string;
}

export interface TripPickupStopCreateDto {
  tripId: number;
  directionId: number;
  order: number;
  pickupTimeOffset: string;
}

export interface TripPickupStopUpdateDto {
  directionId: number;
  order: number;
  pickupTimeOffset: string;
}

export const emptyTripPickupStopForm = {
  tripId: 0,
  directionId: 0,
  order: 1,
  pickupTimeOffset: '',
};

// Combo-ready response shapes
export interface PickupOption {
  directionId: number;
  displayName: string;
  pickupTimeOffset: string | null;
}

export interface DropoffDirectionOption {
  directionId: number;
  displayName: string;
}

export interface DropoffCityOption {
  cityId: number;
  cityName: string;
  price: number;
  isMainDestination?: boolean;
  directions?: DropoffDirectionOption[];
}

export interface Trip {
  tripId: number;
  description: string;
  originCityId: number;
  originCityName: string;
  destinationCityId: number;
  destinationCityName: string;
  status: string;
  prices: TripPrice[];
  relevantCities: CityDirectionsDto[];
  stopSchedules?: TripPickupStopReportDto[] | null;
  pickupOptions?: PickupOption[];
  dropoffOptionsIda?: DropoffCityOption[];
  dropoffOptionsIdaVuelta?: DropoffCityOption[];
}

export interface TripCreateDto {
  description: string;
  originCityId: number;
  destinationCityId: number;
}

export interface TripPriceCreateDto {
  tripId: number;
  cityId: number;
  directionId: number | null;
  reserveTypeId: number;
  price: number;
  order: number;
}

export interface TripPriceUpdateDto {
  cityId: number;
  directionId: number | null;
  reserveTypeId: number;
  price: number;
  order: number;
}

export interface TripReportFilter {
  originCityId?: number;
  destinationCityId?: number;
  status?: string;
}

export interface PriceMassiveUpdateDto {
  priceUpdates: {
    reserveTypeId: number;
    percentage: number;
  }[];
}

export const emptyTripForm = {
  description: '',
  originCityId: 0,
  destinationCityId: 0,
};

export const emptyTripPriceForm = {
  tripId: 0,
  cityId: 0,
  directionId: null as number | null,
  reserveTypeId: 1,
  price: 0,
  order: 1,
};
