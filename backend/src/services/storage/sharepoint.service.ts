// SharePoint Storage Service
// Implements storage interface using Microsoft Graph API

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { InternalServerError, NotFoundError, ServiceUnavailableError } from '../../utils/errors';
import {
  IStorageService,
  StorageUploadOptions,
  StorageUploadResult,
  StorageDownloadResult,
} from './storage.interface';

export class SharePointStorageService implements IStorageService {
  private graphClient: Client;
  private siteId?: string;
  private driveId?: string;

  constructor() {
    // Initialize Azure credential
    const credential = new ClientSecretCredential(
      config.azure.tenantId,
      config.azure.clientId,
      config.azure.clientSecret
    );

    // Initialize Graph client
    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          return token.token;
        },
      },
    });

    // Initialize site and drive IDs
    this.initializeSiteAndDrive().catch((error) => {
      logger.error('Failed to initialize SharePoint site/drive:', error);
    });
  }

  /**
   * Initialize SharePoint site and drive IDs
   */
  private async initializeSiteAndDrive(): Promise<void> {
    try {
      // Parse site URL to get host and path
      const siteUrl = new URL(config.sharepoint.siteUrl);
      const hostname = siteUrl.hostname;
      const sitePath = siteUrl.pathname;

      // Get site ID
      const siteResponse = await this.graphClient
        .api(`/sites/${hostname}:${sitePath}`)
        .get();

      this.siteId = siteResponse.id;
      logger.info(`SharePoint site ID: ${this.siteId}`);

      // Get drive ID for the specified library
      const drivesResponse = await this.graphClient
        .api(`/sites/${this.siteId}/drives`)
        .get();

      const drive = drivesResponse.value.find(
        (d: any) => d.name === config.sharepoint.libraryName
      );

      if (!drive) {
        throw new Error(
          `Document library '${config.sharepoint.libraryName}' not found in SharePoint site`
        );
      }

      this.driveId = drive.id;
      logger.info(`SharePoint drive ID: ${this.driveId}`);
    } catch (error) {
      logger.error('SharePoint initialization error:', error);
      throw new ServiceUnavailableError('SharePoint');
    }
  }

  /**
   * Ensure site and drive are initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.siteId || !this.driveId) {
      await this.initializeSiteAndDrive();
    }
  }

  /**
   * Upload file to SharePoint
   */
  async uploadFile(options: StorageUploadOptions): Promise<StorageUploadResult> {
    try {
      await this.ensureInitialized();

      const { filename, buffer, mimeType, metadata } = options;

      // Clean filename (remove special characters, spaces)
      const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Upload file to SharePoint
      // For files > 4MB, use resumable upload session
      const uploadPath = `/sites/${this.siteId}/drives/${this.driveId}/root:/${cleanFilename}:/content`;

      let response;

      if (buffer.length > 4 * 1024 * 1024) {
        // Use upload session for large files
        response = await this.uploadLargeFile(uploadPath, buffer, mimeType);
      } else {
        // Simple upload for small files
        response = await this.graphClient
          .api(uploadPath)
          .header('Content-Type', mimeType)
          .put(buffer);
      }

      // Update metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        await this.updateFileMetadata(response.id, metadata);
      }

      logger.info(`File uploaded to SharePoint: ${cleanFilename} (${response.id})`);

      return {
        url: response.webUrl,
        id: response.id,
        size: response.size,
      };
    } catch (error) {
      logger.error('SharePoint upload error:', error);
      throw new InternalServerError('Failed to upload file to SharePoint');
    }
  }

  /**
   * Upload large file using resumable upload session
   */
  private async uploadLargeFile(
    path: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<any> {
    try {
      // Create upload session
      const sessionPath = path.replace('/content', '/createUploadSession');
      const session = await this.graphClient
        .api(sessionPath)
        .post({
          item: {
            '@microsoft.graph.conflictBehavior': 'replace',
          },
        });

      const uploadUrl = session.uploadUrl;
      const chunkSize = 320 * 1024; // 320 KB chunks
      let offset = 0;

      while (offset < buffer.length) {
        const chunk = buffer.slice(offset, offset + chunkSize);
        const contentRange = `bytes ${offset}-${offset + chunk.length - 1}/${buffer.length}`;

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Range': contentRange,
            'Content-Type': mimeType,
          },
          body: chunk,
        });

        if (!response.ok && response.status !== 202) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        offset += chunk.length;

        // Last chunk returns the file metadata
        if (offset >= buffer.length) {
          return await response.json();
        }
      }
    } catch (error) {
      logger.error('Large file upload error:', error);
      throw error;
    }
  }

  /**
   * Download file from SharePoint
   */
  async downloadFile(fileId: string): Promise<StorageDownloadResult> {
    try {
      await this.ensureInitialized();

      // Get file metadata
      const fileMetadata = await this.graphClient
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${fileId}`)
        .get();

      // Get download URL
      const downloadUrl = fileMetadata['@microsoft.graph.downloadUrl'];

      if (!downloadUrl) {
        throw new NotFoundError('File', fileId);
      }

      // Download file content
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new NotFoundError('File', fileId);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        mimeType: fileMetadata.file.mimeType,
        filename: fileMetadata.name,
      };
    } catch (error) {
      logger.error('SharePoint download error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to download file from SharePoint');
    }
  }

  /**
   * Delete file from SharePoint
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.ensureInitialized();

      await this.graphClient
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${fileId}`)
        .delete();

      logger.info(`File deleted from SharePoint: ${fileId}`);
    } catch (error) {
      logger.error('SharePoint delete error:', error);
      throw new InternalServerError('Failed to delete file from SharePoint');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      await this.graphClient
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${fileId}`)
        .get();

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<Record<string, any>> {
    try {
      await this.ensureInitialized();

      const metadata = await this.graphClient
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${fileId}`)
        .get();

      return metadata;
    } catch (error) {
      logger.error('SharePoint get metadata error:', error);
      throw new NotFoundError('File', fileId);
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(
    fileId: string,
    metadata: Record<string, string>
  ): Promise<void> {
    try {
      await this.ensureInitialized();

      // SharePoint stores custom metadata in the listItem
      await this.graphClient
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${fileId}/listItem/fields`)
        .patch(metadata);

      logger.info(`File metadata updated in SharePoint: ${fileId}`);
    } catch (error) {
      logger.error('SharePoint update metadata error:', error);
      throw new InternalServerError('Failed to update file metadata');
    }
  }

  /**
   * Get storage provider name
   */
  getProviderName(): string {
    return 'SharePoint';
  }
}
