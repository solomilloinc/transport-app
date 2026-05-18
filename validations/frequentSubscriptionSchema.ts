import type { FormValidationConfig } from '@/hooks/use-form-validation';
import { ReserveType } from '@/interfaces/frequentSubscription';

/**
 * Validación client-side de FrequentSubscription.
 *
 * Reglas:
 * - `customerId`, `reserveTypeId`, `outboundServiceId`, pickup/dropoff Ida, `startDate` siempre requeridos.
 * - Si `reserveTypeId === IdaVuelta`, todos los campos `inbound*` pasan a ser requeridos.
 * - `endDate` opcional; si presente, debe ser ≥ `startDate`.
 *
 * Wire format = camelCase (coincide con el field name del form 1:1).
 */
export const validationConfigFrequentSubscription: FormValidationConfig = {
  customerId: {
    required: { message: 'El cliente es requerido' },
  },
  reserveTypeId: {
    required: { message: 'El tipo de reserva es requerido' },
  },
  outboundServiceId: {
    required: { message: 'El Servicio Ida es requerido' },
  },
  outboundPickupLocationId: {
    required: { message: 'La dirección de subida (Ida) es requerida' },
  },
  outboundDropoffLocationId: {
    required: { message: 'La dirección de bajada (Ida) es requerida' },
  },

  // Condicionalmente requeridos cuando es IdaVuelta.
  inboundServiceId: {
    rules: [
      {
        validate: (value, formData) =>
          Number(formData?.reserveTypeId) !== ReserveType.IdaVuelta || !!value,
        message: 'El Servicio Vuelta es requerido para Ida y Vuelta',
      },
    ],
  },
  inboundPickupLocationId: {
    rules: [
      {
        validate: (value, formData) =>
          Number(formData?.reserveTypeId) !== ReserveType.IdaVuelta || !!value,
        message: 'La dirección de subida (Vuelta) es requerida',
      },
    ],
  },
  inboundDropoffLocationId: {
    rules: [
      {
        validate: (value, formData) =>
          Number(formData?.reserveTypeId) !== ReserveType.IdaVuelta || !!value,
        message: 'La dirección de bajada (Vuelta) es requerida',
      },
    ],
  },

  startDate: {
    required: { message: 'La fecha desde es requerida' },
  },
  endDate: {
    // No required (null = indefinida). Si viene, debe ser ≥ startDate.
    rules: [
      {
        validate: (value, formData) => !value || !formData?.startDate || value >= formData.startDate,
        message: 'La fecha hasta debe ser igual o posterior a la fecha desde',
      },
    ],
  },
};

/**
 * En el form de edición, customer / reserveType / services son inmutables —
 * no se validan porque vienen disabled. Solo se valida lo editable.
 */
export const validationConfigFrequentSubscriptionEdit: FormValidationConfig = {
  outboundPickupLocationId: validationConfigFrequentSubscription.outboundPickupLocationId,
  outboundDropoffLocationId: validationConfigFrequentSubscription.outboundDropoffLocationId,
  inboundPickupLocationId: validationConfigFrequentSubscription.inboundPickupLocationId,
  inboundDropoffLocationId: validationConfigFrequentSubscription.inboundDropoffLocationId,
  startDate: validationConfigFrequentSubscription.startDate,
  endDate: validationConfigFrequentSubscription.endDate,
};
