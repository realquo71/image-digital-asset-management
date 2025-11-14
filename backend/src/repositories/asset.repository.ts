// Asset Repository
// Data access layer for assets

import { PrismaClient, Asset, Prisma, AssetStatus } from '@prisma/client';
import { AssetFilters, PaginationMeta } from '../types';

export class AssetRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create new asset
   */
  async create(data: Prisma.AssetCreateInput): Promise<Asset> {
    return await this.prisma.asset.create({
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        arcoTags: true,
      },
    });
  }

  /**
   * Find asset by ID
   */
  async findById(id: string): Promise<Asset | null> {
    return await this.prisma.asset.findUnique({
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
        tags: {
          include: {
            tag: true,
          },
        },
        arcoTags: true,
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find assets with filters and pagination
   */
  async findMany(
    filters: AssetFilters
  ): Promise<{ items: Asset[]; meta: PaginationMeta }> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          arcoTags: {
            select: {
              id: true,
              category: true,
              label: true,
              notation: true,
              arcoUri: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
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
   * Update asset
   */
  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return await this.prisma.asset.update({
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
        tags: {
          include: {
            tag: true,
          },
        },
        arcoTags: true,
      },
    });
  }

  /**
   * Delete asset
   */
  async delete(id: string): Promise<void> {
    await this.prisma.asset.delete({
      where: { id },
    });
  }

  /**
   * Count assets
   */
  async count(filters?: AssetFilters): Promise<number> {
    const where = filters ? this.buildWhereClause(filters) : {};
    return await this.prisma.asset.count({ where });
  }

  /**
   * Find assets by creator
   */
  async findByCreator(creatorId: string): Promise<Asset[]> {
    return await this.prisma.asset.findMany({
      where: { creatorId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        arcoTags: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters: AssetFilters): Prisma.AssetWhereInput {
    const where: Prisma.AssetWhereInput = {};

    if (filters.status) {
      where.status = filters.status as AssetStatus;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.creatorId) {
      where.creatorId = filters.creatorId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.arcoTypes && filters.arcoTypes.length > 0) {
      where.arcoTags = {
        some: {
          category: 'CULTURAL_PROPERTY_TYPE',
          arcoUri: { in: filters.arcoTypes },
        },
      };
    }

    if (filters.materials && filters.materials.length > 0) {
      where.arcoTags = {
        some: {
          category: 'MATERIAL',
          arcoUri: { in: filters.materials },
        },
      };
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderBy(
    sortBy?: string,
    sortOrder?: string
  ): Prisma.AssetOrderByWithRelationInput {
    const order = (sortOrder || 'desc') as 'asc' | 'desc';

    switch (sortBy) {
      case 'title':
        return { title: order };
      case 'fileSize':
        return { fileSize: order };
      case 'createdAt':
      default:
        return { createdAt: order };
    }
  }
}
