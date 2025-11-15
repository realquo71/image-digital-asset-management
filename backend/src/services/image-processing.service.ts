// Image Processing Service
// Handles EXIF extraction, thumbnail generation, and image optimization using Sharp

import sharp from 'sharp';
import { logger } from '../utils/logger';
import { ExifData } from '../types';

export class ImageProcessingService {
  /**
   * Extract EXIF metadata from image buffer
   */
  async extractExif(buffer: Buffer): Promise<ExifData> {
    try {
      const metadata = await sharp(buffer).metadata();
      const exif = metadata.exif ? this.parseExifBuffer(metadata.exif) : {};

      return {
        width: metadata.width,
        height: metadata.height,
        captureDate: exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal) : undefined,
        camera: exif.Model || metadata.format,
        lens: exif.LensModel,
        focalLength: exif.FocalLength ? `${exif.FocalLength}mm` : undefined,
        aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
        shutterSpeed: exif.ExposureTime,
        iso: exif.ISOSpeedRatings?.toString(),
        gpsLatitude: exif.GPSLatitude ? this.parseGPSCoordinate(exif.GPSLatitude, exif.GPSLatitudeRef) : undefined,
        gpsLongitude: exif.GPSLongitude ? this.parseGPSCoordinate(exif.GPSLongitude, exif.GPSLongitudeRef) : undefined,
      };
    } catch (error) {
      logger.warn('EXIF extraction failed:', error);
      // Return basic metadata even if EXIF parsing fails
      return {
        width: undefined,
        height: undefined,
      };
    }
  }

  /**
   * Parse EXIF buffer to extract relevant fields
   */
  private parseExifBuffer(_exifBuffer: Buffer): Record<string, any> {
    try {
      // Sharp provides EXIF data as a buffer
      // We'll extract common fields manually or use a library
      // For now, return empty object - can be enhanced with exif-parser library
      return {};
    } catch (error) {
      logger.warn('EXIF buffer parsing failed:', error);
      return {};
    }
  }

  /**
   * Parse GPS coordinate from EXIF data
   */
  private parseGPSCoordinate(coordinate: any, ref: string): number {
    if (!Array.isArray(coordinate) || coordinate.length !== 3) {
      return 0;
    }

    const [degrees, minutes, seconds] = coordinate;
    let decimal = degrees + minutes / 60 + seconds / 3600;

    // Apply reference (N/S for latitude, E/W for longitude)
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }

    return decimal;
  }

  /**
   * Generate thumbnail from image buffer
   */
  async generateThumbnail(buffer: Buffer, width: number = 300): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 80,
          progressive: true,
        })
        .toBuffer();
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Optimize image for web (reduce size while maintaining quality)
   */
  async optimizeImage(buffer: Buffer, maxWidth: number = 1920): Promise<Buffer> {
    try {
      const metadata = await sharp(buffer).metadata();

      // If image is already smaller than max width, return as-is
      if (metadata.width && metadata.width <= maxWidth) {
        return buffer;
      }

      // Resize and optimize
      return await sharp(buffer)
        .resize(maxWidth, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();
    } catch (error) {
      logger.error('Image optimization failed:', error);
      // Return original if optimization fails
      return buffer;
    }
  }

  /**
   * Validate image file
   */
  async validateImage(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const metadata = await sharp(buffer).metadata();

      // Check if it's a valid image format
      const supportedFormats = ['jpeg', 'jpg', 'png', 'tiff', 'webp'];
      if (metadata.format && !supportedFormats.includes(metadata.format.toLowerCase())) {
        return {
          valid: false,
          error: `Unsupported image format: ${metadata.format}`,
        };
      }

      // Check dimensions
      if (!metadata.width || !metadata.height) {
        return {
          valid: false,
          error: 'Invalid image dimensions',
        };
      }

      // Check if dimensions are reasonable (not too large)
      const maxDimension = 10000; // 10000 pixels
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        return {
          valid: false,
          error: `Image dimensions too large (max ${maxDimension}px)`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to parse image file',
      };
    }
  }

  /**
   * Get image info without processing
   */
  async getImageInfo(buffer: Buffer): Promise<{
    format: string;
    width: number;
    height: number;
    size: number;
  }> {
    const metadata = await sharp(buffer).metadata();

    return {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: buffer.length,
    };
  }
}
