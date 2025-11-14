// Core type definitions for the backend

import { Request } from 'express';
import { UserRole } from '@prisma/client';

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  azureAdId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ============================================================================
// ASSET TYPES
// ============================================================================

export interface AssetFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  creatorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  arcoTypes?: string[];
  materials?: string[];
  sortBy?: 'createdAt' | 'title' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface ExifData {
  width?: number;
  height?: number;
  captureDate?: Date;
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

// ============================================================================
// ARCO TYPES
// ============================================================================

export interface ArCoTerm {
  uri: string;
  label: string;
  definition?: string;
  notation?: string;
  broader?: string[];
  narrower?: string[];
  related?: string[];
  altLabels?: string[];
}

export interface ArCoTagInput {
  category: string;
  arcoUri: string;
  label: string;
  notation?: string;
}

// ============================================================================
// JOB TYPES
// ============================================================================

export enum JobType {
  REORGANIZE_LIBRARY = 'reorganize-library',
  BULK_TAG = 'bulk-tag',
  ARCO_SYNC = 'arco-sync',
  GENERATE_THUMBNAILS = 'generate-thumbnails',
}

export interface JobStatus {
  id: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  data: any;
  result?: any;
  failedReason?: string;
  logs?: string[];
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
    password?: string;
  };
  azure: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  sharepoint: {
    siteUrl: string;
    libraryName: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  arco: {
    sparqlEndpoint: string;
    cacheTTL: number;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
