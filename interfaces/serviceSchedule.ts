
export interface ServiceSchedule {
    ServiceScheduleId: number;
    ServiceId: number;
    StartDate: string;
    EndDate: string;
    IsHoliday: boolean;
    DepartureHour: string;
}