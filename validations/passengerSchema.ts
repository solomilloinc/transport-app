import { emailRule, maxLengthRule, minLengthRule, numbersOnlyRule } from "@/utils/validation-rules";

export const validationConfigPassenger = {
  firstName: {
    required: { message: 'El nombre es requerido' },
  },
  lastName: {
    required: { message: 'El apellido es requerido' },
  },
  email: {
    rules: [{ validate: (v: string) => !v || emailRule.validate(v), message: emailRule.message }],
  },
  documentNumber: {
    required: { message: 'El número de documento es requerido' },
    rules: [minLengthRule(7), maxLengthRule(8), numbersOnlyRule],
  },
  phone1: {},
};