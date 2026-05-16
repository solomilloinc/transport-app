export interface ServiceSchedule {
  serviceScheduleId: number;
  serviceId: number;
  departureHour: string; // TimeSpan from API
  isHoliday: boolean;
  status: string;
}

export const emptyServiceSchedule = {
  serviceId: 0,
  isHoliday: false,
  departureHour: '10:00',
};
