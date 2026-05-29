export const validationConfigEditReserve = {
  vehicleId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'El vehículo es requerido' }],
  },
  departureHour: {
    required: { message: 'La hora de salida es requerida' },
  },
};
