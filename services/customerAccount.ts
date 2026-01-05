import { get, postWithResponse } from "./api"
import { CustomerAccountSummary } from "@/interfaces/customerAccount"
import { PagedRequest, PagedResponse, PaginationParams, UseApiCall } from "./types"
import { withDefaultPagination } from "@/utils/pagination"

export const getCustomerAccountSummary = (customerId: number, params?: Partial<PaginationParams>): UseApiCall<CustomerAccountSummary> => {
    const finalParams = withDefaultPagination(params);
    return {
        call: get<any, any>(`/customer-account-summary/${customerId}`, {
            pageNumber: finalParams.pageNumber,
            pageSize: finalParams.pageSize,
            filters: {
                FromDate: finalParams.filters?.fromDate,
                ToDate: finalParams.filters?.toDate
            }
        })
    }
}
