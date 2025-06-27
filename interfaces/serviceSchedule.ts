
export interface ServiceSchedule {
    ServiceScheduleId: number;
    ServiceId: number;
    IsHoliday: boolean;
    DepartureHour: string;
}

export const emptyServiceSchedule = {
    ServiceId: 0,
    IsHoliday: 0,
    DepartureHour: ""
}

