// Asset Controller
// Handles asset-related HTTP requests

import { Request, Response, NextFunction } from 'express';
import { AssetService } from '../services/asset.service';
import { BulkDownloadService } from '../services/bulk-download.service';
import { CreateAssetDto, UpdateAssetDto, AssetSearchDto, AddTagsDto } from '../dto/asset.dto';
import { AuthenticatedRequest } from '../types';
import { getPrismaClient } from '../config/database';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AssetController {
  private assetService: AssetService;
  private bulkDownloadService: BulkDownloadService;

  constructor() {
    this.assetService = new AssetService(getPrismaClient());
    this.bulkDownloadService = new BulkDownloadService();
  }

  /**
   * POST /assets
   * Upload new asset
   */
  upload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!authReq.file) {
        throw new BadRequestError('No file uploaded');
      }

      // Validate metadata from form fields
      const metadata = CreateAssetDto.validate({
        title: authReq.body.title,
        description: authReq.body.description,
        status: authReq.body.status,
      });

      const asset = await this.assetService.uploadAsset(authReq.file, metadata, authReq.user.id);

      logger.info(`Asset uploaded: ${asset.id} by ${authReq.user.email}`);

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const filters = AssetSearchDto.validate(authReq.query) as any;

      const result = await this.assetService.listAssets(
        filters,
        authReq.user?.id,
        authReq.user?.role
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = authReq.params;

      const asset = await this.assetService.getAssetById(id, authReq.user?.id);

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = authReq.params;
      const data = UpdateAssetDto.validate(authReq.body);

      const asset = await this.assetService.updateAsset(
        id,
        data,
        authReq.user.id,
        authReq.user.role
      );

      logger.info(`Asset updated: ${id} by ${authReq.user.email}`);

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = authReq.params;

      await this.assetService.deleteAsset(id, authReq.user.id, authReq.user.role);

      logger.info(`Asset deleted: ${id} by ${authReq.user.email}`);

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = authReq.params;

      const file = await this.assetService.downloadAsset(id);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.buffer);

      logger.info(`Asset downloaded: ${id} by ${authReq.user?.email || 'anonymous'}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /assets/:id/thumbnail
   * Download asset thumbnail
   */
  downloadThumbnail = async (
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = authReq.params;
      const { tags } = AddTagsDto.validate(authReq.body);

      const asset = await this.assetService.addTags(id, tags, authReq.user.id);

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id, tagId } = authReq.params;

      const asset = await this.assetService.removeTag(id, tagId, authReq.user.id);

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
   * POST /assets/:id/arco-tags
   * Add ArCo tags to asset
   */
  addArCoTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = authReq.params;
      const { arcoTags } = authReq.body;

      if (!arcoTags || !Array.isArray(arcoTags)) {
        throw new BadRequestError('arcoTags must be an array');
      }

      const asset = await this.assetService.addArCoTags(id, arcoTags, authReq.user.id);

      logger.info(`ArCo tags added to asset ${id} by ${authReq.user.email}`);

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /assets/:id/arco-tags/:arcoUri
   * Remove ArCo tag from asset
   */
  removeArCoTag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id, arcoUri } = authReq.params;

      // Decode the URI since it will be URL-encoded
      const decodedUri = decodeURIComponent(arcoUri);

      const asset = await this.assetService.removeArCoTag(id, decodedUri, authReq.user.id);

      logger.info(`ArCo tag ${decodedUri} removed from asset ${id}`);

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
    _req: Request,
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

  /**
   * POST /assets/bulk-download
   * Bulk download multiple assets as ZIP
   */
  bulkDownload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { assetIds, includeMetadata } = authReq.body;

      if (!assetIds || !Array.isArray(assetIds)) {
        throw new BadRequestError('assetIds must be an array');
      }

      const result = await this.bulkDownloadService.createBulkDownload({
        assetIds,
        includeMetadata: includeMetadata === true,
        userId: authReq.user?.id,
      });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      // Stream the ZIP to response
      result.stream.pipe(res);

      logger.info(`Bulk download: ${assetIds.length} assets by ${authReq.user?.email || 'anonymous'}`);
    } catch (error) {
      next(error);
    }
  };
}
