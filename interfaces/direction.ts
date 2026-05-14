export interface Direction {
  directionId: number;
  cityId: number;
  cityName?: string;
  name: string;
}

export const emptyDirection = {
  cityId: 0,
  name: '',
};
