// Define the Direction interface
export interface Direction {
    DirectionId: number;
    CityId: number;
    CityName?: string;
    Name: string;
  }

  export const emptyDirection = {
    cityId: 0,
    name: '',
  };