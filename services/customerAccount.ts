import { get, getPure, postWithResponse } from "./api"
import { CustomerAccountSummary, CustomerDebtSettleRequest, PendingReserve } from "@/interfaces/customerAccount"
import { PagedRequest, PagedResponse, PaginationParams, UseApiCall } from "./types"
import { withDefaultPagination } from "@/utils/pagination"

export const getCustomerAccountSummary = (customerId: number, params?: Partial<PaginationParams>): UseApiCall<CustomerAccountSummary> => {
    const finalParams = withDefaultPagination(params);
    return {
        call: get<any, any>(`/customer-account-summary/${customerId}`, {
            pageNumber: finalParams.pageNumber,
            pageSize: finalParams.pageSize,
            filters: {
                TransactionType: finalParams.filters?.transactionType,
                FromDate: finalParams.filters?.fromDate,
                ToDate: finalParams.filters?.toDate
            }
        })
    }
}

export const getCustomerPendingReserves = async (customerId: number) => {
    return getPure<PendingReserve[]>(
        `/customer-pending-reserves/${customerId}`
    );
};

export const settleCustomerDebt = async (request: CustomerDebtSettleRequest) => {
    return postWithResponse<CustomerDebtSettleRequest, { isSuccess: boolean; value: boolean }>(
        '/customer-debt-settle', request
    );
};
