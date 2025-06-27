export interface SelectOption {
  id: string;
  value: string;
  label: string;
  [key: string]: any; // Por si querés agregar props como `defaultQuantity`, `extraInfo`, etc.
}
