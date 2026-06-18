const emailRule = {
  validate: (value: string) => /\S+@\S+\.\S+/.test(value ?? ''),
  message: 'Ingresá un email válido',
};

export const validationConfigOperativeUserCreate = {
  email: {
    required: { message: 'El email es requerido' },
    rules: [emailRule],
  },
  password: {
    required: { message: 'La contraseña es requerida' },
    rules: [
      {
        validate: (value: string) => (value?.length ?? 0) >= 6,
        message: 'La contraseña debe tener al menos 6 caracteres',
      },
    ],
  },
};

export const validationConfigOperativeUserEdit = {
  email: {
    required: { message: 'El email es requerido' },
    rules: [emailRule],
  },
};
