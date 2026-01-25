export interface TripPrice {
  TripPriceId: number;
  TripId: number;
  CityId: number;
  CityName: string;
  DirectionId: number | null;
  DirectionName: string | null;
  ReserveTypeId: number;
  ReserveTypeName: string;
  Price: number;
  Order: number;
  Status: string;
}

export interface CityDirectionItem {
  DirectionId: number;
  Name: string;
}

export interface CityDirectionsDto {
  CityId: number;
  Name: string;
  Directions: CityDirectionItem[];
}

// New simplified interfaces for combo options (PascalCase to match backend)
export interface PickupOption {
  DirectionId: number;
  DisplayName: string;
}

export interface DropoffDirectionOption {
  DirectionId: number;
  DisplayName: string;
}

export interface DropoffCityOption {
  CityId: number;
  CityName: string;
  Price: number;
  IsMainDestination?: boolean;
  Directions?: DropoffDirectionOption[];
}

export interface Trip {
  TripId: number;
  Description: string;
  OriginCityId: number;
  OriginCityName: string;
  DestinationCityId: number;
  DestinationCityName: string;
  Status: string;
  Prices: TripPrice[];
  RelevantCities: CityDirectionsDto[];
  // New combo-ready fields
  PickupOptions?: PickupOption[];
  DropoffOptionsIda?: DropoffCityOption[];
  DropoffOptionsIdaVuelta?: DropoffCityOption[];
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
