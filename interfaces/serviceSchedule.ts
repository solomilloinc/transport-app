
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

/**
 * Single-row draft used by the SchedulesEditor / bulk sync payload.
 *
 * `ServiceScheduleId = null` means "create a new schedule" (bulk sync semantics).
 * Missing items from the payload are soft-deleted by the backend.
 */
export interface ServiceScheduleDraft {
    ServiceScheduleId: number | null;
    DepartureHour: string; // "HH:MM" in the editor, normalized to "HH:MM:SS" before POST
    IsHoliday: boolean;
}

/**
 * Bulk sync request payload for PUT /api/service-schedules-sync/{serviceId}.
 * The backend calculates the diff against DB in a single transaction.
 */
export interface ServiceScheduleSyncRequest {
    schedules: Array<{
        serviceScheduleId: number | null;
        departureHour: string; // "HH:MM:SS"
        isHoliday: boolean;
    }>;
}
