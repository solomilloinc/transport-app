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
    const response = await getPure<any>(
        `/customer-pending-reserves/${customerId}`
    );
    const rawItems = response?.value ?? response?.Value ?? response;
    if (!Array.isArray(rawItems)) return [];
    return rawItems.map((item: any) => ({
        ReserveId: item.ReserveId ?? item.reserveId,
        ReserveDate: item.ReserveDate ?? item.reserveDate,
        OriginName: item.OriginName ?? item.originName,
        DestinationName: item.DestinationName ?? item.destinationName,
        DepartureHour: item.DepartureHour ?? item.departureHour,
        TotalPrice: item.TotalPrice ?? item.totalPrice ?? 0,
        TotalPaid: item.TotalPaid ?? item.totalPaid ?? 0,
        PendingDebt: item.PendingDebt ?? item.pendingDebt ?? 0,
        Passengers: (item.Passengers ?? item.passengers ?? []).map((p: any) => ({
            PassengerId: p.PassengerId ?? p.passengerId,
            FullName: p.FullName ?? p.fullName,
            Price: p.Price ?? p.price ?? 0,
            Status: p.Status ?? p.status ?? 0,
        })),
    })) as PendingReserve[];
};

export const settleCustomerDebt = async (request: CustomerDebtSettleRequest) => {
    return postWithResponse<CustomerDebtSettleRequest, { isSuccess: boolean; value: boolean }>(
        '/customer-debt-settle', request
    );
};
