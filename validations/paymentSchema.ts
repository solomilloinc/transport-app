import { maxValueRule, minValueRule } from "@/utils/validation-rules";

export const validationConfigPayment = {
  TransactionAmount: {
    required: true,
    rules: [minValueRule(1), maxValueRule(999999.99)],
  },
  PaymentMethod: {
    required: true,
  },
};