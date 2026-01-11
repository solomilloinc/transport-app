import { UseApiCall } from "./types";
import { get, post } from "./api";
import CashBox from "@/interfaces/cash-box";

/**
 * Gets the current active cash box.
 */
export const getCurrentCashBox = (): UseApiCall<any, CashBox> => {
    return {
        call: get<any, CashBox>(`/cashbox/current`),
    };
};

/**
 * Closes a cash box with a description.
 * @param description The description for the closure.
 */
export const closeCashBox = ({ description }: { description: string }): UseApiCall<any, number> => {
    return {
        call: post<any>(`/cashbox/close`, { Description: description }),
    };
};
