import type { Country, Admin1, City } from '@prisma/client';

export interface CountryWithRelations extends Country {
  admin1s: Admin1[];
  cities: City[];
}

export interface Admin1WithRelations extends Admin1 {
  country: Country;
  cities: City[];
}

export interface CityWithRelations extends City {
  country: Country;
  admin1?: Admin1 | null;
}

export interface LocationHierarchy {
  country: Country;
  admin1?: Admin1 | null;
  city?: City | null;
}

export interface CreateCountryRequest {
  iso2: string;
  iso3: string;
  name: string;
}

export interface CreateAdmin1Request {
  countryId: string;
  code: string;
  name: string;
}

export interface CreateCityRequest {
  countryId: string;
  admin1Id?: string;
  name: string;
  isMunicipality?: boolean;
}
