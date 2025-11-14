// Asset Service
// Business logic for asset management

import { PrismaClient, Asset, AssetStatus } from '@prisma/client';
import { AssetRepository } from '../repositories/asset.repository';
import { SharePointStorageService } from './storage/sharepoint.service';
import { ImageProcessingService } from './image-processing.service';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ValidationError,
} from '../utils/errors';
import { AssetFilters, PaginationMeta } from '../types';
import { CreateAssetDto, UpdateAssetDto } from '../dto/asset.dto';

export class AssetService {
  private assetRepository: AssetRepository;
  private storageService: SharePointStorageService;
  private imageService: ImageProcessingService;

  constructor(private prisma: PrismaClient) {
    this.assetRepository = new AssetRepository(prisma);
    this.storageService = new SharePointStorageService();
    this.imageService = new ImageProcessingService();
  }

  /**
   * Upload and create new asset
   */
  async uploadAsset(
    file: Express.Multer.File,
    metadata: CreateAssetDto,
    userId: string
  ): Promise<Asset> {
    try {
      // Validate file
      this.validateFile(file);

      // For images, validate and extract EXIF
      let exifData = {};
      let thumbnailUrl: string | undefined;

      if (this.isImage(file.mimetype)) {
        // Validate image
        const validation = await this.imageService.validateImage(file.buffer);
        if (!validation.valid) {
          throw new BadRequestError(validation.error || 'Invalid image file');
        }

        // Extract EXIF metadata
        exifData = await this.imageService.extractExif(file.buffer);

        // Generate and upload thumbnail
        const thumbnail = await this.imageService.generateThumbnail(file.buffer, 300);

        const thumbnailResult = await this.storageService.uploadFile({
          filename: `thumb_${file.originalname}`,
          buffer: thumbnail,
          mimeType: 'image/jpeg',
          metadata: {
            type: 'thumbnail',
            originalAsset: file.originalname,
          },
        });

        thumbnailUrl = thumbnailResult.url;
      }

      // Upload original file to SharePoint
      const uploadResult = await this.storageService.uploadFile({
        filename: file.originalname,
        buffer: file.buffer,
        mimeType: file.mimetype,
        metadata: {
          title: metadata.title,
          description: metadata.description || '',
          uploadedBy: userId,
        },
      });

      // Create asset record in database
      const asset = await this.assetRepository.create({
        title: metadata.title,
        description: metadata.description,
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        sharepointUrl: uploadResult.url,
        sharepointId: uploadResult.id,
        thumbnailUrl,
        status: metadata.status || AssetStatus.DRAFT,
        creator: {
          connect: { id: userId },
        },
        ...exifData,
      });

      logger.info(`Asset created: ${asset.id} by user ${userId}`);

      return asset;
    } catch (error) {
      logger.error('Asset upload error:', error);
      throw error;
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: string, userId?: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError('Asset', id);
    }

    // Check permissions (VIEWER can only see PUBLISHED assets)
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (user && user.role === 'VIEWER' && asset.status !== AssetStatus.PUBLISHED) {
        throw new ForbiddenError('You do not have permission to view this asset');
      }
    }

    return asset;
  }

  /**
   * List assets with filters
   */
  async listAssets(
    filters: AssetFilters,
    userId?: string,
    userRole?: string
  ): Promise<{ items: Asset[]; meta: PaginationMeta }> {
    // VIEWER can only see PUBLISHED assets
    if (userRole === 'VIEWER') {
      filters.status = AssetStatus.PUBLISHED;
    }

    return await this.assetRepository.findMany(filters);
  }

  /**
   * Update asset metadata
   */
  async updateAsset(
    id: string,
    data: UpdateAssetDto,
    userId: string,
    userRole: string
  ): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError('Asset', id);
    }

    // Check permissions
    // Only ADMIN can edit any asset, CURATOR can only edit own assets
    if (userRole !== 'ADMIN' && asset.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to edit this asset');
    }

    // Update asset
    const updatedAsset = await this.assetRepository.update(id, {
      ...data,
      // Set publishedAt when status changes to PUBLISHED
      ...(data.status === AssetStatus.PUBLISHED &&
        asset.status !== AssetStatus.PUBLISHED && {
          publishedAt: new Date(),
        }),
    });

    logger.info(`Asset updated: ${id} by user ${userId}`);

    return updatedAsset;
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: string, userId: string, userRole: string): Promise<void> {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError('Asset', id);
    }

    // Check permissions
    // Only ADMIN can delete any asset, CURATOR can only delete own assets
    if (userRole !== 'ADMIN' && asset.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this asset');
    }

    // Delete from SharePoint
    try {
      await this.storageService.deleteFile(asset.sharepointId);

      // Delete thumbnail if exists
      if (asset.thumbnailUrl) {
        // Extract thumbnail ID from URL (implementation depends on SharePoint URL structure)
        // For now, we'll catch errors if thumbnail deletion fails
        try {
          const thumbnailId = this.extractFileIdFromUrl(asset.thumbnailUrl);
          if (thumbnailId) {
            await this.storageService.deleteFile(thumbnailId);
          }
        } catch (error) {
          logger.warn(`Failed to delete thumbnail for asset ${id}:`, error);
        }
      }
    } catch (error) {
      logger.error(`Failed to delete file from SharePoint for asset ${id}:`, error);
      // Continue with database deletion even if SharePoint deletion fails
    }

    // Delete from database
    await this.assetRepository.delete(id);

    logger.info(`Asset deleted: ${id} by user ${userId}`);
  }

  /**
   * Download asset file
   */
  async downloadAsset(id: string): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError('Asset', id);
    }

    // Download from SharePoint
    const file = await this.storageService.downloadFile(asset.sharepointId);

    return {
      buffer: file.buffer,
      filename: asset.filename,
      mimeType: asset.mimeType,
    };
  }

  /**
   * Download thumbnail
   */
  async downloadThumbnail(id: string): Promise<{
    buffer: Buffer;
    mimeType: string;
  }> {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError('Asset', id);
    }

    if (!asset.thumbnailUrl) {
      throw new NotFoundError('Thumbnail', id);
    }

    // Extract thumbnail ID from URL
    const thumbnailId = this.extractFileIdFromUrl(asset.thumbnailUrl);

    if (!thumbnailId) {
      throw new NotFoundError('Thumbnail', id);
    }

    // Download from SharePoint
    const file = await this.storageService.downloadFile(thumbnailId);

    return {
      buffer: file.buffer,
      mimeType: file.mimeType,
    };
  }

  /**
   * Add tags to asset
   */
  async addTags(assetId: string, tagNames: string[], userId: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(assetId);

    if (!asset) {
      throw new NotFoundError('Asset', assetId);
    }

    // Create tags if they don't exist
    for (const tagName of tagNames) {
      const tag = await this.prisma.tag.upsert({
        where: { name: tagName.toLowerCase() },
        update: {},
        create: { name: tagName.toLowerCase() },
      });

      // Link tag to asset (ignore if already linked)
      await this.prisma.assetTag.upsert({
        where: {
          assetId_tagId: {
            assetId,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          assetId,
          tagId: tag.id,
        },
      });
    }

    logger.info(`Tags added to asset ${assetId}: ${tagNames.join(', ')}`);

    // Return updated asset
    return (await this.assetRepository.findById(assetId))!;
  }

  /**
   * Remove tag from asset
   */
  async removeTag(assetId: string, tagId: string, userId: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(assetId);

    if (!asset) {
      throw new NotFoundError('Asset', assetId);
    }

    // Remove tag link
    await this.prisma.assetTag.delete({
      where: {
        assetId_tagId: {
          assetId,
          tagId,
        },
      },
    });

    logger.info(`Tag ${tagId} removed from asset ${assetId}`);

    // Return updated asset
    return (await this.assetRepository.findById(assetId))!;
  }

  /**
   * Get asset statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recentUploads: number;
  }> {
    const total = await this.assetRepository.count();

    const byStatus = await this.prisma.asset.groupBy({
      by: ['status'],
      _count: true,
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = await this.assetRepository.count({
      dateFrom: sevenDaysAgo,
    });

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentUploads,
    };
  }

  /**
   * Validate file upload
   */
  private validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ValidationError([
        {
          field: 'file',
          message: `File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
        },
      ]);
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new ValidationError([
        {
          field: 'file',
          message: `File size must be less than 100MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        },
      ]);
    }
  }

  /**
   * Check if MIME type is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Extract file ID from SharePoint URL
   * This is a placeholder - actual implementation depends on SharePoint URL structure
   */
  private extractFileIdFromUrl(url: string): string | null {
    // SharePoint URLs can vary - this needs to be implemented based on actual URL structure
    // For now, return null and handle gracefully
    return null;
  }
}
