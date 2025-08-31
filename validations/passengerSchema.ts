export const validationConfigPassenger = {
  FirstName: {
    required: { message: 'El nombre es requerido' },
  },
  LastName: {
    required: { message: 'El apellido es requerido' },
  },
  Email: {
    // Email is optional
  },
  DocumentNumber: {
    required: { message: 'El número de documento es requerido' },
  },
  Phone1: {
    required: { message: 'El teléfono 1 es requerido' },
  },
};