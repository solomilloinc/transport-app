export const validationConfigVehicle = {
  // select de ID cuyo "sin elegir" es 0, que `required` no detecta (sólo cubre
  // undefined/null/""); por eso va con regla > 0.
  vehicleTypeId: {
    rules: [{ validate: (v: number) => Number(v) > 0, message: 'El tipo de vehículo es requerido' }],
  },
  internalNumber: {
    required: { message: 'El número interno es requerido' },
  },
  // `required` no detecta NaN (puede llegar así si el autocompletado por tipo
  // de vehículo no encuentra el `defaultQuantity`), por eso también validamos
  // que sea un número finito mayor a 0.
  availableQuantity: {
    required: { message: 'La cantidad disponible es requerida' },
    rules: [
      {
        validate: (v: number) => Number.isFinite(Number(v)) && Number(v) > 0,
        message: 'La cantidad disponible debe ser un número mayor a 0',
      },
    ],
  },
};