// For services-list endpoint response
export interface ServiceIdNameDto {
    ServiceId: number;
    Name: string;
}

// For customer report services (different format from API)
export interface CustomerServiceDto {
    ServiceId: number;
    ServiceName: string;
}
