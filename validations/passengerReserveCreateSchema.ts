import { z } from 'zod';
import { RESERVE_TYPE } from '@/constants/reserveType';

const legInfoSchema = z.object({
  pickupLocationId: z.number().int().nullable(),
  dropoffLocationId: z.number().int().nullable(),
  price: z.number().nonnegative(),
});

const passengerBookingSchema = z.object({
  customerId: z.number().int(),
  isPayment: z.boolean(),
  hasTraveled: z.boolean(),
  outbound: legInfoSchema,
  return: legInfoSchema.nullable(),
});

const passengerBookingExternalSchema = z.object({
  customerId: z.number().int().nullable(),
  isPayment: z.boolean(),
  hasTraveled: z.boolean(),
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  email: z.string().email().or(z.literal('')).nullable(),
  phone1: z.string().min(1, 'phone1 is required'),
  documentNumber: z.string().min(1, 'documentNumber is required'),
  outbound: legInfoSchema,
  return: legInfoSchema.nullable(),
});

const paymentItemSchema = z.object({
  transactionAmount: z.number().positive(),
  paymentMethod: z.number().int(),
});

const externalPaymentSchema = z.object({
  transactionAmount: z.number().positive(),
  token: z.string().min(1),
  description: z.string(),
  installments: z.number().int().positive(),
  paymentMethodId: z.string().min(1),
  payerEmail: z.string(),
  identificationType: z.string().optional(),
  identificationNumber: z.string().optional(),
});

const reserveTypeSchema = z.union([
  z.literal(RESERVE_TYPE.IDA),
  z.literal(RESERVE_TYPE.ROUND_TRIP),
]);

// Enforces server-side rules 1–6 (see backend doc, section 3).
const sharedWrapperRefine = <
  T extends {
    reserveTypeId: number;
    outboundReserveId: number;
    returnReserveId: number | null;
    passengers: Array<{ return: unknown }>;
  },
>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  if (data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP && data.returnReserveId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['returnReserveId'],
      message: 'returnReserveId is required when reserveTypeId = ROUND_TRIP',
    });
  }
  if (data.reserveTypeId === RESERVE_TYPE.IDA && data.returnReserveId !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['returnReserveId'],
      message: 'returnReserveId must be null when reserveTypeId = IDA',
    });
  }
  if (
    data.returnReserveId !== null &&
    data.outboundReserveId === data.returnReserveId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['returnReserveId'],
      message: 'outboundReserveId and returnReserveId must differ',
    });
  }
  data.passengers.forEach((p, i) => {
    if (data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP && p.return === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passengers', i, 'return'],
        message: 'return leg is required when reserveTypeId = ROUND_TRIP',
      });
    }
    if (data.reserveTypeId === RESERVE_TYPE.IDA && p.return !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passengers', i, 'return'],
        message: 'return leg must be null when reserveTypeId = IDA',
      });
    }
  });
};

export const passengerReserveCreateRequestSchema = z
  .object({
    reserveTypeId: reserveTypeSchema,
    outboundReserveId: z.number().int().positive(),
    returnReserveId: z.number().int().positive().nullable(),
    payments: z.array(paymentItemSchema),
    passengers: z.array(passengerBookingSchema).min(1, 'at least one passenger required'),
  })
  .superRefine(sharedWrapperRefine);

export const createReserveWithLockRequestSchema = z
  .object({
    lockToken: z.string().min(1),
    reserveTypeId: reserveTypeSchema,
    outboundReserveId: z.number().int().positive(),
    returnReserveId: z.number().int().positive().nullable(),
    payment: externalPaymentSchema.nullable(),
    passengers: z
      .array(passengerBookingExternalSchema)
      .min(1, 'at least one passenger required'),
  })
  .superRefine(sharedWrapperRefine);
