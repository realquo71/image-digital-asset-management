// Collection Controller
// Handles collection-related HTTP requests

import { Response, NextFunction } from 'express';
import { CollectionService, CreateCollectionDto, UpdateCollectionDto } from '../services/collection.service';
import { BulkDownloadService } from '../services/bulk-download.service';
import { CollectionFilters } from '../repositories/collection.repository';
import { AuthenticatedRequest } from '../types';
import { getPrismaClient } from '../config/database';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export class CollectionController {
  private collectionService: CollectionService;
  private bulkDownloadService: BulkDownloadService;

  constructor() {
    this.collectionService = new CollectionService(getPrismaClient());
    this.bulkDownloadService = new BulkDownloadService();
  }

  /**
   * POST /collections
   * Create new collection
   */
  create = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const data: CreateCollectionDto = {
        name: req.body.name,
        description: req.body.description,
        isPublic: req.body.isPublic,
      };

      if (!data.name || data.name.trim().length === 0) {
        throw new BadRequestError('Collection name is required');
      }

      const collection = await this.collectionService.createCollection(data, req.user.id);

      logger.info(`Collection created: ${collection.id} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /collections
   * List collections with filters
   */
  list = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: CollectionFilters = {
        search: req.query.search as string,
        creatorId: req.query.creatorId as string,
        isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await this.collectionService.listCollections(
        filters,
        req.user?.id,
        req.user?.role
      );

      res.json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /collections/:id
   * Get single collection by ID
   */
  getById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const collection = await this.collectionService.getCollectionById(id, req.user?.id);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /collections/:id
   * Update collection
   */
  update = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const data: UpdateCollectionDto = {
        name: req.body.name,
        description: req.body.description,
        isPublic: req.body.isPublic,
      };

      const collection = await this.collectionService.updateCollection(
        id,
        data,
        req.user.id,
        req.user.role
      );

      logger.info(`Collection updated: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /collections/:id
   * Delete collection
   */
  delete = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;

      await this.collectionService.deleteCollection(id, req.user.id, req.user.role);

      logger.info(`Collection deleted: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Collection deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /collections/:id/assets
   * Add assets to collection
   */
  addAssets = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const { assetIds } = req.body;

      if (!assetIds || !Array.isArray(assetIds)) {
        throw new BadRequestError('assetIds must be an array');
      }

      const collection = await this.collectionService.addAssets(
        id,
        assetIds,
        req.user.id,
        req.user.role
      );

      logger.info(`Assets added to collection ${id}: ${assetIds.length} items`);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /collections/:id/assets
   * Remove assets from collection
   */
  removeAssets = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const { assetIds } = req.body;

      if (!assetIds || !Array.isArray(assetIds)) {
        throw new BadRequestError('assetIds must be an array');
      }

      const collection = await this.collectionService.removeAssets(
        id,
        assetIds,
        req.user.id,
        req.user.role
      );

      logger.info(`Assets removed from collection ${id}: ${assetIds.length} items`);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /collections/:id/duplicate
   * Duplicate collection
   */
  duplicate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const { name } = req.body;

      const collection = await this.collectionService.duplicateCollection(
        id,
        req.user.id,
        name
      );

      logger.info(`Collection duplicated: ${id} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /collections/:id/share
   * Make collection public
   */
  share = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;

      const collection = await this.collectionService.shareCollection(
        id,
        req.user.id,
        req.user.role
      );

      logger.info(`Collection shared: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /collections/:id/unshare
   * Make collection private
   */
  unshare = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;

      const collection = await this.collectionService.unshareCollection(
        id,
        req.user.id,
        req.user.role
      );

      logger.info(`Collection unshared: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: collection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /collections/me
   * Get current user's collections
   */
  getMy = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const collections = await this.collectionService.getUserCollections(req.user.id);

      res.json({
        success: true,
        data: collections,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /collections/:id/download
   * Download collection assets as ZIP
   */
  downloadCollection = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.bulkDownloadService.createCollectionDownload(
        id,
        req.user?.id
      );

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      // Stream the ZIP to response
      result.stream.pipe(res);

      logger.info(`Collection download: ${id} by ${req.user?.email || 'anonymous'}`);
    } catch (error) {
      next(error);
    }
  };
}
