// Asset Controller
// Handles asset-related HTTP requests

import { Response, NextFunction } from 'express';
import { AssetService } from '../services/asset.service';
import { CreateAssetDto, UpdateAssetDto, AssetSearchDto, AddTagsDto } from '../dto/asset.dto';
import { AuthenticatedRequest } from '../types';
import { getPrismaClient } from '../config/database';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AssetController {
  private assetService: AssetService;

  constructor() {
    this.assetService = new AssetService(getPrismaClient());
  }

  /**
   * POST /assets
   * Upload new asset
   */
  upload = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      // Validate metadata from form fields
      const metadata = CreateAssetDto.validate({
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
      });

      const asset = await this.assetService.uploadAsset(req.file, metadata, req.user.id);

      logger.info(`Asset uploaded: ${asset.id} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /assets
   * List assets with filters
   */
  list = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = AssetSearchDto.validate(req.query);

      const result = await this.assetService.listAssets(
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
   * GET /assets/:id
   * Get single asset by ID
   */
  getById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const asset = await this.assetService.getAssetById(id, req.user?.id);

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /assets/:id
   * Update asset metadata
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
      const data = UpdateAssetDto.validate(req.body);

      const asset = await this.assetService.updateAsset(
        id,
        data,
        req.user.id,
        req.user.role
      );

      logger.info(`Asset updated: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /assets/:id
   * Delete asset
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

      await this.assetService.deleteAsset(id, req.user.id, req.user.role);

      logger.info(`Asset deleted: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Asset deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /assets/:id/download
   * Download original asset file
   */
  download = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const file = await this.assetService.downloadAsset(id);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.buffer);

      logger.info(`Asset downloaded: ${id} by ${req.user?.email || 'anonymous'}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /assets/:id/thumbnail
   * Download asset thumbnail
   */
  downloadThumbnail = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const file = await this.assetService.downloadThumbnail(id);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', 'inline');
      res.send(file.buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /assets/:id/tags
   * Add tags to asset
   */
  addTags = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const { tags } = AddTagsDto.validate(req.body);

      const asset = await this.assetService.addTags(id, tags, req.user.id);

      logger.info(`Tags added to asset ${id}: ${tags.join(', ')}`);

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /assets/:id/tags/:tagId
   * Remove tag from asset
   */
  removeTag = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id, tagId } = req.params;

      const asset = await this.assetService.removeTag(id, tagId, req.user.id);

      logger.info(`Tag ${tagId} removed from asset ${id}`);

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /assets/stats
   * Get asset statistics
   */
  getStatistics = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.assetService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
