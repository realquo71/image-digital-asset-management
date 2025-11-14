// Collection Service
// Business logic for collection management

import { PrismaClient, Collection } from '@prisma/client';
import { CollectionRepository, CollectionFilters } from '../repositories/collection.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PaginationMeta } from '../types';

export interface CreateCollectionDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export class CollectionService {
  private collectionRepository: CollectionRepository;

  constructor(private prisma: PrismaClient) {
    this.collectionRepository = new CollectionRepository(prisma);
  }

  /**
   * Create new collection
   */
  async createCollection(
    data: CreateCollectionDto,
    userId: string
  ): Promise<Collection> {
    const collection = await this.collectionRepository.create({
      name: data.name,
      description: data.description,
      isPublic: data.isPublic !== undefined ? data.isPublic : false,
      creator: {
        connect: { id: userId },
      },
    });

    logger.info(`Collection created: ${collection.id} by user ${userId}`);

    return collection;
  }

  /**
   * Get collection by ID
   */
  async getCollectionById(id: string, userId?: string): Promise<Collection> {
    const collection = await this.collectionRepository.findById(id);

    if (!collection) {
      throw new NotFoundError('Collection', id);
    }

    // Check permissions
    // If collection is private, only owner can access
    if (!collection.isPublic && userId && collection.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to access this collection');
    }

    return collection;
  }

  /**
   * List collections with filters
   */
  async listCollections(
    filters: CollectionFilters,
    userId?: string,
    userRole?: string
  ): Promise<{ items: Collection[]; meta: PaginationMeta }> {
    // Non-authenticated users can only see public collections
    if (!userId) {
      filters.isPublic = true;
    } else if (userRole === 'VIEWER') {
      // Viewers can see public collections and their own
      // This requires modifying the where clause, so we handle it in repository
      // For now, show all public collections
      filters.isPublic = true;
    }

    return await this.collectionRepository.findMany(filters);
  }

  /**
   * Update collection
   */
  async updateCollection(
    id: string,
    data: UpdateCollectionDto,
    userId: string,
    userRole: string
  ): Promise<Collection> {
    const collection = await this.collectionRepository.findById(id);

    if (!collection) {
      throw new NotFoundError('Collection', id);
    }

    // Check permissions
    // Only ADMIN can edit any collection, others can only edit own collections
    if (userRole !== 'ADMIN' && collection.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to edit this collection');
    }

    const updated = await this.collectionRepository.update(id, data);

    logger.info(`Collection updated: ${id} by user ${userId}`);

    return updated;
  }

  /**
   * Delete collection
   */
  async deleteCollection(id: string, userId: string, userRole: string): Promise<void> {
    const collection = await this.collectionRepository.findById(id);

    if (!collection) {
      throw new NotFoundError('Collection', id);
    }

    // Check permissions
    // Only ADMIN can delete any collection, others can only delete own collections
    if (userRole !== 'ADMIN' && collection.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this collection');
    }

    await this.collectionRepository.delete(id);

    logger.info(`Collection deleted: ${id} by user ${userId}`);
  }

  /**
   * Add assets to collection
   */
  async addAssets(
    collectionId: string,
    assetIds: string[],
    userId: string,
    userRole: string
  ): Promise<Collection> {
    const collection = await this.collectionRepository.findById(collectionId);

    if (!collection) {
      throw new NotFoundError('Collection', collectionId);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && collection.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to edit this collection');
    }

    if (!assetIds || assetIds.length === 0) {
      throw new BadRequestError('At least one asset ID is required');
    }

    // Verify all assets exist
    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
      },
    });

    if (assets.length !== assetIds.length) {
      const foundIds = assets.map(a => a.id);
      const missingIds = assetIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError('Assets', missingIds.join(', '));
    }

    await this.collectionRepository.addAssets(collectionId, assetIds);

    logger.info(`Added ${assetIds.length} assets to collection ${collectionId}`);

    // Return updated collection
    return (await this.collectionRepository.findById(collectionId))!;
  }

  /**
   * Remove assets from collection
   */
  async removeAssets(
    collectionId: string,
    assetIds: string[],
    userId: string,
    userRole: string
  ): Promise<Collection> {
    const collection = await this.collectionRepository.findById(collectionId);

    if (!collection) {
      throw new NotFoundError('Collection', collectionId);
    }

    // Check permissions
    if (userRole !== 'ADMIN' && collection.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to edit this collection');
    }

    if (!assetIds || assetIds.length === 0) {
      throw new BadRequestError('At least one asset ID is required');
    }

    await this.collectionRepository.removeAssets(collectionId, assetIds);

    logger.info(`Removed ${assetIds.length} assets from collection ${collectionId}`);

    // Return updated collection
    return (await this.collectionRepository.findById(collectionId))!;
  }

  /**
   * Get user's collections
   */
  async getUserCollections(userId: string): Promise<Collection[]> {
    return await this.collectionRepository.findByCreator(userId);
  }

  /**
   * Duplicate collection
   */
  async duplicateCollection(
    id: string,
    userId: string,
    newName?: string
  ): Promise<Collection> {
    const original = await this.collectionRepository.findById(id);

    if (!original) {
      throw new NotFoundError('Collection', id);
    }

    // Create new collection
    const duplicate = await this.collectionRepository.create({
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      isPublic: false, // Duplicates are private by default
      creator: {
        connect: { id: userId },
      },
    });

    // Copy asset associations
    const assetIds = original.assets?.map((ca: any) => ca.assetId) || [];

    if (assetIds.length > 0) {
      await this.collectionRepository.addAssets(duplicate.id, assetIds);
    }

    logger.info(`Collection duplicated: ${id} -> ${duplicate.id} by user ${userId}`);

    // Return with assets
    return (await this.collectionRepository.findById(duplicate.id))!;
  }

  /**
   * Share collection (make public)
   */
  async shareCollection(
    id: string,
    userId: string,
    userRole: string
  ): Promise<Collection> {
    return await this.updateCollection(id, { isPublic: true }, userId, userRole);
  }

  /**
   * Unshare collection (make private)
   */
  async unshareCollection(
    id: string,
    userId: string,
    userRole: string
  ): Promise<Collection> {
    return await this.updateCollection(id, { isPublic: false }, userId, userRole);
  }
}
