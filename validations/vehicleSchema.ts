export const validationConfigVehicle = {
  vehicleTypeId: {
    required: true,
    message: 'El tipo de vehículo es requerido',
  },
  internalNumber: {
    required: true,
    message: 'El número interno es requerido',
  },
  availableQuantity: {
    required: true,
    message: 'La cantidad disponible es requerida',
  },
};