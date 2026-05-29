export const validationConfigDirection = {
  // select de ciudad cuyo "sin elegir" es 0, que required no detecta
  cityId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'La ciudad es requerida' }],
  },
  name: {
    required: { message: 'La direccion es requerida' },
  },
};