import { maxLengthRule, maxValueRule, minLengthRule, minValueRule } from "@/utils/validation-rules";

export const validationConfig = {
  name: {
    required: { message: 'El nombre es requerido' },
    rules: [minLengthRule(3), maxLengthRule(50)],
  },
  quantity: {
    required: { message: 'La capacidad es requerida' },
    rules: [minValueRule(1), maxValueRule(100)],
  },
};
