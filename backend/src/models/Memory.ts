import type { Memory as PrismaMemory, Country, Admin1, City, Tag, User } from '@prisma/client';

type PublicUser = Omit<User, 'password'>;

export interface MemoryWithRelations extends PrismaMemory {
  createdBy: PublicUser;
  country: Country;
  admin1?: Admin1 | null;
  city?: City | null;
  memoryTags: Array<{
    tag: Tag;
  }>;
}

export interface CreateMemoryRequest {
  happenedAt: string;
  title: string;
  topic?: string;
  locationTxt?: string;
  countryId: string;
  admin1Id?: string;
  cityId?: string;
  imageUrl?: string | string[]; // 支持单图或多图
  tagIds?: string[];
  latitude?: number;
  longitude?: number;
}

export interface UpdateMemoryRequest {
  happenedAt?: string;
  title?: string;
  topic?: string;
  locationTxt?: string;
  countryId?: string;
  admin1Id?: string;
  cityId?: string;
  imageUrl?: string | string[]; // 支持单图或多图
  tagIds?: string[];
  latitude?: number;
  longitude?: number;
}

export interface MemoryFilters {
  page?: number;
  limit?: number;
  countryId?: string;
  admin1Id?: string;
  cityId?: string;
  tagIds?: string[];
  startDate?: string;
  endDate?: string;
}

export interface PaginatedMemories {
  memories: MemoryWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
