// Bulk Download Service
// Handles creating ZIP archives of multiple assets

import archiver from 'archiver';
import { Readable } from 'stream';
import { IStorageService } from './storage/storage.interface';
import { SharePointStorageService } from './storage/sharepoint.service';
import { AssetRepository } from '../repositories/asset.repository';
import { getPrismaClient } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface BulkDownloadOptions {
  assetIds: string[];
  includeMetadata?: boolean;
  userId?: string;
}

export class BulkDownloadService {
  private storageService: IStorageService;
  private assetRepository: AssetRepository;

  constructor() {
    this.storageService = new SharePointStorageService();
    this.assetRepository = new AssetRepository(getPrismaClient());
  }

  /**
   * Create ZIP archive of multiple assets
   */
  async createBulkDownload(options: BulkDownloadOptions): Promise<{
    stream: Readable;
    filename: string;
    totalSize: number;
  }> {
    const { assetIds, includeMetadata = false, userId } = options;

    if (!assetIds || assetIds.length === 0) {
      throw new BadRequestError('At least one asset ID is required');
    }

    if (assetIds.length > 100) {
      throw new BadRequestError('Maximum 100 assets can be downloaded at once');
    }

    // Fetch all assets
    const assets = await Promise.all(
      assetIds.map(id => this.assetRepository.findById(id))
    );

    // Filter out null results and check all assets exist
    const validAssets = assets.filter(asset => asset !== null);

    if (validAssets.length === 0) {
      throw new NotFoundError('Assets', assetIds.join(', '));
    }

    if (validAssets.length !== assetIds.length) {
      const foundIds = validAssets.map(a => a!.id);
      const missingIds = assetIds.filter(id => !foundIds.includes(id));
      logger.warn(`Some assets not found: ${missingIds.join(', ')}`);
    }

    // Check permissions - non-published assets require authentication
    const restrictedAssets = validAssets.filter(
      asset => asset!.status !== 'PUBLISHED' && (!userId || asset!.creatorId !== userId)
    );

    if (restrictedAssets.length > 0 && !userId) {
      throw new BadRequestError('Some assets require authentication');
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 6 }, // Compression level (0-9)
    });

    // Track total size
    let totalSize = 0;
    validAssets.forEach(asset => {
      totalSize += asset!.fileSize;
    });

    // Handle archive errors
    archive.on('error', (err) => {
      logger.error('Archive creation error:', err);
      throw err;
    });

    // Download and add each file to archive
    const downloadPromises = validAssets.map(async (asset) => {
      try {
        const file = await this.storageService.downloadFile(asset!.sharepointId);

        // Use original filename, but ensure uniqueness
        let filename = asset!.filename;
        const existingCount = validAssets.filter(
          a => a!.filename === filename && a!.id !== asset!.id
        ).length;

        if (existingCount > 0) {
          const nameParts = filename.split('.');
          const ext = nameParts.pop();
          const baseName = nameParts.join('.');
          filename = `${baseName}_${asset!.id.slice(0, 8)}.${ext}`;
        }

        archive.append(file.buffer, { name: filename });

        logger.debug(`Added to archive: ${filename}`);
      } catch (error) {
        logger.error(`Failed to download asset ${asset!.id}:`, error);
        // Continue with other files even if one fails
      }
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);

    // Add metadata file if requested
    if (includeMetadata) {
      const metadata = validAssets.map(asset => ({
        id: asset!.id,
        title: asset!.title,
        description: asset!.description,
        filename: asset!.filename,
        mimeType: asset!.mimeType,
        fileSize: asset!.fileSize,
        status: asset!.status,
        createdAt: asset!.createdAt,
        updatedAt: asset!.updatedAt,
        creator: {
          name: (asset as any).creator?.name,
          email: (asset as any).creator?.email,
        },
        tags: (asset as any).tags?.map((at: any) => at.tag.name) || [],
        arcoTags: (asset as any).arcoTags?.map((tag: any) => ({
          uri: tag.arcoUri,
          label: tag.label,
          category: tag.category,
        })) || [],
      }));

      const metadataJson = JSON.stringify(metadata, null, 2);
      archive.append(metadataJson, { name: 'metadata.json' });
    }

    // Finalize archive (no more files will be added)
    await archive.finalize();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `assets_${validAssets.length}_${timestamp}.zip`;

    logger.info(`Bulk download created: ${validAssets.length} assets, ${totalSize} bytes`);

    return {
      stream: archive as unknown as Readable,
      filename,
      totalSize,
    };
  }

  /**
   * Create ZIP of collection assets
   */
  async createCollectionDownload(
    collectionId: string,
    userId?: string
  ): Promise<{
    stream: Readable;
    filename: string;
    totalSize: number;
  }> {
    const prisma = getPrismaClient();

    // Fetch collection with assets
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError('Collection', collectionId);
    }

    // Check if user can access collection
    if (!collection.isPublic && userId !== collection.creatorId) {
      throw new BadRequestError('You do not have permission to download this collection');
    }

    const assetIds = collection.assets.map(ca => ca.assetId);

    if (assetIds.length === 0) {
      throw new BadRequestError('Collection is empty');
    }

    const result = await this.createBulkDownload({
      assetIds,
      includeMetadata: true,
      userId,
    });

    // Use collection name in filename
    const safeCollectionName = collection.name.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    result.filename = `${safeCollectionName}_${timestamp}.zip`;

    return result;
  }
}
