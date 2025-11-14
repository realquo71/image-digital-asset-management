// Storage Service Interface
// Abstraction layer to support both SharePoint and Azure Blob Storage
// This allows easy migration between storage providers

export interface StorageUploadOptions {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  url: string;
  id: string;
  size: number;
}

export interface StorageDownloadResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export interface IStorageService {
  /**
   * Upload a file to storage
   */
  uploadFile(options: StorageUploadOptions): Promise<StorageUploadResult>;

  /**
   * Download a file from storage
   */
  downloadFile(fileId: string): Promise<StorageDownloadResult>;

  /**
   * Delete a file from storage
   */
  deleteFile(fileId: string): Promise<void>;

  /**
   * Check if a file exists
   */
  fileExists(fileId: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getFileMetadata(fileId: string): Promise<Record<string, any>>;

  /**
   * Update file metadata
   */
  updateFileMetadata(fileId: string, metadata: Record<string, string>): Promise<void>;

  /**
   * Get storage provider name
   */
  getProviderName(): string;
}
