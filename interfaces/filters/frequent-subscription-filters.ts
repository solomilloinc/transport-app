import { ReserveType } from '../frequentSubscription';
import { EntityStatus } from './common';

/**
 * Espejo de `FrequentSubscriptionReportFilterRequestDto` del backend.
 *
 * Default semántico: si `status` viene null/undefined, el backend filtra
 * por Active. Para ver Cancelled/All hay que mandar el valor explícito.
 */
export interface FrequentSubscriptionReportFilters {
  customerId?: number;
  outboundServiceId?: number;
  inboundServiceId?: number;
  reserveTypeId?: ReserveType;
  status?: EntityStatus;
  /** ISO yyyy-mm-dd. Filtra subs vigentes en esa fecha. */
  activeAtDate?: string;
}

export const emptyFrequentSubscriptionReportFilters: FrequentSubscriptionReportFilters = {
  customerId: undefined,
  outboundServiceId: undefined,
  inboundServiceId: undefined,
  reserveTypeId: undefined,
  status: undefined,
  activeAtDate: undefined,
};
