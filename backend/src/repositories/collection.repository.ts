// Collection Repository
// Data access layer for collections

import { PrismaClient, Collection, Prisma } from '@prisma/client';
import { PaginationMeta } from '../types';

export interface CollectionFilters {
  search?: string;
  creatorId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CollectionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create new collection
   */
  async create(data: Prisma.CollectionCreateInput): Promise<Collection> {
    return await this.prisma.collection.create({
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assets: {
          include: {
            asset: {
              select: {
                id: true,
                title: true,
                filename: true,
                mimeType: true,
                thumbnailUrl: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find collection by ID
   */
  async findById(id: string): Promise<Collection | null> {
    return await this.prisma.collection.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assets: {
          include: {
            asset: {
              select: {
                id: true,
                title: true,
                description: true,
                filename: true,
                mimeType: true,
                fileSize: true,
                thumbnailUrl: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Find collections with filters and pagination
   */
  async findMany(
    filters: CollectionFilters
  ): Promise<{ items: Collection[]; meta: PaginationMeta }> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assets: {
            select: {
              asset: {
                select: {
                  id: true,
                  thumbnailUrl: true,
                },
              },
            },
            take: 4, // Preview thumbnails
          },
          _count: {
            select: {
              assets: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.collection.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update collection
   */
  async update(id: string, data: Prisma.CollectionUpdateInput): Promise<Collection> {
    return await this.prisma.collection.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assets: {
          include: {
            asset: {
              select: {
                id: true,
                title: true,
                filename: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete collection
   */
  async delete(id: string): Promise<void> {
    await this.prisma.collection.delete({
      where: { id },
    });
  }

  /**
   * Add assets to collection
   */
  async addAssets(collectionId: string, assetIds: string[]): Promise<void> {
    const operations = assetIds.map((assetId) =>
      this.prisma.collectionAsset.upsert({
        where: {
          collectionId_assetId: {
            collectionId,
            assetId,
          },
        },
        update: {},
        create: {
          collectionId,
          assetId,
        },
      })
    );

    await Promise.all(operations);
  }

  /**
   * Remove assets from collection
   */
  async removeAssets(collectionId: string, assetIds: string[]): Promise<void> {
    await this.prisma.collectionAsset.deleteMany({
      where: {
        collectionId,
        assetId: {
          in: assetIds,
        },
      },
    });
  }

  /**
   * Get collections by creator
   */
  async findByCreator(creatorId: string): Promise<Collection[]> {
    return await this.prisma.collection.findMany({
      where: { creatorId },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count collections
   */
  async count(filters?: CollectionFilters): Promise<number> {
    const where = filters ? this.buildWhereClause(filters) : {};
    return await this.prisma.collection.count({ where });
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters: CollectionFilters): Prisma.CollectionWhereInput {
    const where: Prisma.CollectionWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.creatorId) {
      where.creatorId = filters.creatorId;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderBy(
    sortBy?: string,
    sortOrder?: string
  ): Prisma.CollectionOrderByWithRelationInput {
    const order = (sortOrder || 'desc') as 'asc' | 'desc';

    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'createdAt':
      default:
        return { createdAt: order };
    }
  }
}
