import type { Hotel as PrismaHotel, Country, Admin1, City, User } from '@prisma/client';

type PublicUser = Omit<User, 'password'>;

export interface HotelWithRelations extends PrismaHotel {
  createdBy: PublicUser;
  country: Country;
  admin1?: Admin1 | null;
  city?: City | null;
  hotelImages: Array<{
    id: string;
    imageUrl: string;
    order: number;
  }>;
  roomCardImages: Array<{
    id: string;
    imageUrl: string;
    order: number;
  }>;
}

export interface CreateHotelRequest {
  name: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate?: string; // YYYY-MM-DD
  locationTxt?: string;
  countryId: string;
  admin1Id?: string;
  cityId?: string;
  notes?: string;
  rating?: number; // 1-5
  hotelImages?: string[]; // 图片URL数组
  roomCardImages?: string[]; // 房卡图片URL数组
}

export interface UpdateHotelRequest {
  name?: string;
  checkInDate?: string;
  checkOutDate?: string;
  locationTxt?: string;
  countryId?: string;
  admin1Id?: string;
  cityId?: string;
  notes?: string;
  rating?: number;
  hotelImages?: string[];
  roomCardImages?: string[];
}

export interface HotelFilters {
  page?: number;
  limit?: number;
  countryId?: string;
  admin1Id?: string;
  cityId?: string;
  startDate?: string;
  endDate?: string;
  rating?: number;
}

export interface PaginatedHotels {
  hotels: HotelWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
