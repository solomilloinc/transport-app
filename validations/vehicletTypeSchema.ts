import { maxLengthRule, maxValueRule, minLengthRule, minValueRule } from "@/utils/validation-rules";

export const validationConfig = {
  Name: {
    required: true,
    rules: [minLengthRule(3), maxLengthRule(50)],
  },
  Quantity: {
    required: true,
    rules: [minValueRule(1), maxValueRule(100)],
  },
};
