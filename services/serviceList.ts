import { getPure } from "./api";
import { ServiceIdNameDto } from "@/interfaces/serviceList";

export const getServicesList = async (): Promise<ServiceIdNameDto[]> => {
    return getPure<ServiceIdNameDto[]>('/services-list');
};
