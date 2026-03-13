import { get, getPure, postWithResponse } from "./api"
import { CustomerAccountSummary, CustomerDebtSettleRequest, PendingReserve, Transaction } from "@/interfaces/customerAccount"
import { PagedRequest, PagedResponse, PaginationParams, UseApiCall } from "./types"
import { withDefaultPagination } from "@/utils/pagination"

export const getCustomerAccountSummary = (customerId: number, params?: Partial<PaginationParams>): UseApiCall<any, any> => {
    const finalParams = withDefaultPagination(params);
    return {
        call: get<any, any>(`/customer-account-summary/${customerId}`, {
            pageNumber: finalParams.pageNumber,
            pageSize: finalParams.pageSize,
            sortBy: finalParams.sortBy === 'fecha' ? 'date' : (finalParams.sortBy || 'date'),
            sortDescending: finalParams.sortDescending ?? true,
            filters: {
                transactionType: finalParams.filters?.transactionType || null,
                fromDate: finalParams.filters?.fromDate || null,
                toDate: finalParams.filters?.toDate || null,
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
