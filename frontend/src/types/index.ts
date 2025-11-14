// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  CURATOR = 'CURATOR',
  RESEARCHER = 'RESEARCHER',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  azureAdId?: string;
  createdAt: string;
  updatedAt: string;
}

// Asset types
export enum AssetStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface Asset {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  mimeType: string;
  fileSize: number;
  status: AssetStatus;
  sharepointUrl: string;
  sharepointId: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  camera: string | null;
  captureDate: Date | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  creatorId: string;
  creator?: User;
  tags?: Tag[];
  arcoTags?: ArcoTag[];
  collections?: Collection[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

// ArCo types
export enum ArcoCategory {
  CULTURAL_PROPERTY_TYPE = 'CULTURAL_PROPERTY_TYPE',
  MATERIAL = 'MATERIAL',
  TECHNIQUE = 'TECHNIQUE',
  SUBJECT = 'SUBJECT',
  DATING = 'DATING',
  CURRENT_LOCATION = 'CURRENT_LOCATION',
  CREATION_PLACE = 'CREATION_PLACE',
  HISTORICAL_PERIOD = 'HISTORICAL_PERIOD',
}

export interface ArcoTag {
  arcoUri: string;
  label: string;
  category: ArcoCategory;
  notation: string | null;
}

export interface ArcoEntity {
  uri: string;
  label: string;
  notation?: string;
  description?: string;
  category: string;
}

// Collection types
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  creatorId: string;
  creator?: User;
  assets?: Asset[];
  assetCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Search types
export interface SearchFilters {
  query?: string;
  status?: AssetStatus;
  creatorId?: string;
  tags?: string[];
  arcoCategories?: ArcoCategory[];
  arcoUris?: string[];
  dateFrom?: string;
  dateTo?: string;
  mimeTypes?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'createdAt' | 'title' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  items: Asset[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  aggregations?: {
    statuses?: Array<{ key: string; count: number }>;
    mimeTypes?: Array<{ key: string; count: number }>;
    arcoCategories?: Array<{ key: string; count: number }>;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  aggregations?: any;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Pagination types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Upload types
export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  assetId?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
