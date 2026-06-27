import { get, getPure, postWithResponse } from "./api"
import { CustomerAccountAdjustmentRequest, CustomerAccountSummary, CustomerDebtSettleRequest, PendingReserve, Transaction } from "@/interfaces/customerAccount"
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

export const createCustomerAccountAdjustment = async (
    customerId: number,
    request: CustomerAccountAdjustmentRequest
) => {
    return postWithResponse<CustomerAccountAdjustmentRequest, { isSuccess: boolean; value: boolean }>(
        `/customer-account-adjustment/${customerId}`, request
    );
};

/**
 * Devolución de caja: devuelve en efectivo el dinero de un pago de reserva ya
 * cobrado. Operación independiente de la cancelación del pasajero — primero se
 * cancela el pasajero y DESPUÉS, si corresponde, se devuelve la plata desde acá.
 *
 * Path param: el `reservePaymentId` de la fila de la cuenta corriente. Sin body.
 * Roles: Admin / Operator. OK: Result<bool> (true). Idempotente del lado back:
 * una vez devuelto el pago queda Refunded y reintentar falla con NotRefundable.
 */
export const refundPaymentCash = async (reservePaymentId: number) => {
    return postWithResponse<undefined, { isSuccess: boolean; value: boolean }>(
        `/payment-cash-refund/${reservePaymentId}`
    );
};
