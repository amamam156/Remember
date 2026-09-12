import type { Tag as PrismaTag } from '@prisma/client';

export interface TagWithCount extends PrismaTag {
  _count: {
    memoryTags: number;
  };
}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name: string;
}
