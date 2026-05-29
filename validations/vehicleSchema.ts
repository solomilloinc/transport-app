export const validationConfigVehicle = {
  // select de ID cuyo "sin elegir" es 0, que `required` no detecta (sólo cubre
  // undefined/null/""); por eso va con regla > 0.
  vehicleTypeId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'El tipo de vehículo es requerido' }],
  },
  internalNumber: {
    required: { message: 'El número interno es requerido' },
  },
  availableQuantity: {
    required: { message: 'La cantidad disponible es requerida' },
  },
};