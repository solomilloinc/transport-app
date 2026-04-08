/**
 * Espejo de `DirectionReportFilterRequestDto` del backend.
 */
export interface DirectionReportFilters {
  directionName?: string;
  cityId?: number;
}

export const emptyDirectionReportFilters: DirectionReportFilters = {
  directionName: '',
  cityId: undefined,
};
