import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-toastify';
import {
  ApiResponse,
  ApiError,
  User,
  Asset,
  Tag,
  ArcoEntity,
  Collection,
  SearchFilters,
  SearchResult,
  LoginResponse,
  UploadProgress,
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/v1/auth/refresh', {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    // Display error toast
    const errorMessage =
      error.response?.data?.error?.message || error.message || 'An error occurred';
    toast.error(errorMessage);

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),

  azureLogin: () =>
    api.get<ApiResponse<{ redirectUrl: string }>>('/auth/azure/login'),

  azureCallback: (code: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/azure/callback', { code }),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken,
    }),

  logout: () => api.post('/auth/logout'),

  getCurrentUser: () => api.get<ApiResponse<User>>('/auth/me'),
};

// Users API
export const usersApi = {
  getUsers: (page = 1, limit = 50) =>
    api.get<ApiResponse<User[]>>('/users', { params: { page, limit } }),

  getUser: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),

  updateUserRole: (id: string, role: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}/role`, { role }),

  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// Assets API
export const assetsApi = {
  getAssets: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    creatorId?: string;
  }) => api.get<ApiResponse<Asset[]>>('/assets', { params }),

  getAsset: (id: string) => api.get<ApiResponse<Asset>>(`/assets/${id}`),

  uploadAsset: (
    file: File,
    metadata: {
      title: string;
      description?: string;
      status?: string;
    },
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.status) {
      formData.append('status', metadata.status);
    }

    return api.post<ApiResponse<Asset>>('/assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  updateAsset: (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
    }
  ) => api.patch<ApiResponse<Asset>>(`/assets/${id}`, data),

  deleteAsset: (id: string) => api.delete(`/assets/${id}`),

  downloadAsset: (id: string) =>
    api.get(`/assets/${id}/download`, { responseType: 'blob' }),

  downloadThumbnail: (id: string) =>
    api.get(`/assets/${id}/thumbnail`, { responseType: 'blob' }),
};

// Tags API
export const tagsApi = {
  getTags: () => api.get<ApiResponse<Tag[]>>('/tags'),

  addTagToAsset: (assetId: string, tagName: string) =>
    api.post<ApiResponse<Tag>>(`/assets/${assetId}/tags`, { name: tagName }),

  removeTagFromAsset: (assetId: string, tagId: string) =>
    api.delete(`/assets/${assetId}/tags/${tagId}`),
};

// ArCo API
export const arcoApi = {
  searchTerms: (category: string, query: string) =>
    api.get<ApiResponse<ArcoEntity[]>>('/arco/search', {
      params: { category, query },
    }),

  getTermByUri: (uri: string) =>
    api.get<ApiResponse<ArcoEntity>>('/arco/term', { params: { uri } }),

  addArcoTagToAsset: (
    assetId: string,
    arcoUri: string,
    category: string,
    label: string
  ) =>
    api.post(`/assets/${assetId}/arco-tags`, {
      arcoUri,
      category,
      label,
    }),

  removeArcoTagFromAsset: (assetId: string, arcoUri: string) =>
    api.delete(`/assets/${assetId}/arco-tags/${encodeURIComponent(arcoUri)}`),
};

// Search API
export const searchApi = {
  search: (filters: SearchFilters) =>
    api.post<ApiResponse<SearchResult>>('/search', filters),

  advancedSearch: (filters: SearchFilters) =>
    api.post<ApiResponse<SearchResult>>('/search/advanced', filters),
};

// Collections API
export const collectionsApi = {
  getCollections: (page = 1, limit = 20) =>
    api.get<ApiResponse<Collection[]>>('/collections', {
      params: { page, limit },
    }),

  getCollection: (id: string) =>
    api.get<ApiResponse<Collection>>(`/collections/${id}`),

  createCollection: (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => api.post<ApiResponse<Collection>>('/collections', data),

  updateCollection: (
    id: string,
    data: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ) => api.patch<ApiResponse<Collection>>(`/collections/${id}`, data),

  deleteCollection: (id: string) => api.delete(`/collections/${id}`),

  addAssetToCollection: (collectionId: string, assetId: string) =>
    api.post(`/collections/${collectionId}/assets`, { assetId }),

  removeAssetFromCollection: (collectionId: string, assetId: string) =>
    api.delete(`/collections/${collectionId}/assets/${assetId}`),

  downloadCollection: (collectionId: string) =>
    api.get(`/collections/${collectionId}/download`, { responseType: 'blob' }),
};

// Download API
export const downloadApi = {
  bulkDownload: (assetIds: string[]) =>
    api.post('/download/bulk', { assetIds }, { responseType: 'blob' }),
};

// Audit API (Admin only)
export const auditApi = {
  getAuditLogs: (params?: {
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<any[]>>('/audit', { params }),

  getEntityAuditTrail: (type: string, id: string) =>
    api.get<ApiResponse<any[]>>(`/audit/entity/${type}/${id}`),

  getAuditStatistics: (dateFrom?: string, dateTo?: string) =>
    api.get<ApiResponse<any>>('/audit/stats', {
      params: { dateFrom, dateTo },
    }),

  exportAuditLogs: (params?: {
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('/audit/export', { params, responseType: 'blob' }),
};

export default api;
