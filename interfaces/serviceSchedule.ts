
export interface ServiceSchedule {
    ServiceScheduleId: number;
    ServiceId: number;
    DepartureHour: string; // TimeSpan from API
    IsHoliday: boolean;
    Status: string;
}

export const emptyServiceSchedule = {
    ServiceId: 0,
    IsHoliday: false,
    DepartureHour: "10:00"
}

