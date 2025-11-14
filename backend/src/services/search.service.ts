// Search Service
// Handles Elasticsearch indexing and search operations

import { Client } from '@elastic/elasticsearch';
import { getElasticsearchClient } from '../config/elasticsearch';
import { Asset } from '@prisma/client';
import { logger } from '../utils/logger';
import { InternalServerError } from '../utils/errors';

export interface SearchAssetDocument {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  tags: string[];
  arcoTags: Array<{
    uri: string;
    label: string;
    category: string;
    notation?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  // EXIF metadata
  width?: number;
  height?: number;
  camera?: string;
  captureDate?: Date;
}

export interface SearchFilters {
  query?: string;
  status?: string;
  creatorId?: string;
  tags?: string[];
  arcoCategories?: string[];
  arcoUris?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  mimeTypes?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  items: SearchAssetDocument[];
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

export class SearchService {
  private client: Client;
  private indexName: string = 'assets';

  constructor() {
    this.client = getElasticsearchClient();
  }

  /**
   * Initialize index with mapping
   */
  async initializeIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                description: { type: 'text' },
                filename: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                mimeType: { type: 'keyword' },
                fileSize: { type: 'long' },
                status: { type: 'keyword' },
                creatorId: { type: 'keyword' },
                creatorName: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                creatorEmail: { type: 'keyword' },
                tags: { type: 'keyword' },
                arcoTags: {
                  type: 'nested',
                  properties: {
                    uri: { type: 'keyword' },
                    label: { type: 'text' },
                    category: { type: 'keyword' },
                    notation: { type: 'keyword' },
                  },
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                publishedAt: { type: 'date' },
                width: { type: 'integer' },
                height: { type: 'integer' },
                camera: { type: 'keyword' },
                captureDate: { type: 'date' },
              },
            },
            settings: {
              analysis: {
                analyzer: {
                  default: {
                    type: 'standard',
                  },
                },
              },
            },
          },
        });

        logger.info(`Elasticsearch index '${this.indexName}' created`);
      } else {
        logger.info(`Elasticsearch index '${this.indexName}' already exists`);
      }
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch index:', error);
      throw new InternalServerError('Failed to initialize search index');
    }
  }

  /**
   * Index a single asset
   */
  async indexAsset(asset: any): Promise<void> {
    try {
      const document: SearchAssetDocument = {
        id: asset.id,
        title: asset.title,
        description: asset.description,
        filename: asset.filename,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        status: asset.status,
        creatorId: asset.creatorId,
        creatorName: asset.creator?.name || '',
        creatorEmail: asset.creator?.email || '',
        tags: asset.tags?.map((at: any) => at.tag.name) || [],
        arcoTags: asset.arcoTags?.map((tag: any) => ({
          uri: tag.arcoUri,
          label: tag.label,
          category: tag.category,
          notation: tag.notation,
        })) || [],
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        publishedAt: asset.publishedAt,
        width: asset.width,
        height: asset.height,
        camera: asset.camera,
        captureDate: asset.captureDate,
      };

      await this.client.index({
        index: this.indexName,
        id: asset.id,
        document,
      });

      logger.debug(`Asset indexed: ${asset.id}`);
    } catch (error) {
      logger.error(`Failed to index asset ${asset.id}:`, error);
      // Don't throw - indexing failures shouldn't break asset operations
    }
  }

  /**
   * Bulk index assets
   */
  async bulkIndexAssets(assets: any[]): Promise<void> {
    try {
      if (assets.length === 0) {
        return;
      }

      const operations = assets.flatMap((asset) => {
        const document: SearchAssetDocument = {
          id: asset.id,
          title: asset.title,
          description: asset.description,
          filename: asset.filename,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
          status: asset.status,
          creatorId: asset.creatorId,
          creatorName: asset.creator?.name || '',
          creatorEmail: asset.creator?.email || '',
          tags: asset.tags?.map((at: any) => at.tag.name) || [],
          arcoTags: asset.arcoTags?.map((tag: any) => ({
            uri: tag.arcoUri,
            label: tag.label,
            category: tag.category,
            notation: tag.notation,
          })) || [],
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
          publishedAt: asset.publishedAt,
          width: asset.width,
          height: asset.height,
          camera: asset.camera,
          captureDate: asset.captureDate,
        };

        return [
          { index: { _index: this.indexName, _id: asset.id } },
          document,
        ];
      });

      const response = await this.client.bulk({
        operations,
        refresh: true,
      });

      if (response.errors) {
        logger.warn('Some assets failed to index:', {
          errors: response.items.filter((item: any) => item.index?.error),
        });
      } else {
        logger.info(`Bulk indexed ${assets.length} assets`);
      }
    } catch (error) {
      logger.error('Bulk index failed:', error);
      throw new InternalServerError('Failed to bulk index assets');
    }
  }

  /**
   * Delete asset from index
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: assetId,
      });

      logger.debug(`Asset removed from index: ${assetId}`);
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        logger.debug(`Asset not found in index: ${assetId}`);
      } else {
        logger.error(`Failed to delete asset from index ${assetId}:`, error);
      }
    }
  }

  /**
   * Search assets with filters
   */
  async searchAssets(filters: SearchFilters): Promise<SearchResult> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const from = (page - 1) * limit;

      // Build query
      const must: any[] = [];
      const filter: any[] = [];

      // Full-text search
      if (filters.query) {
        must.push({
          multi_match: {
            query: filters.query,
            fields: ['title^3', 'description^2', 'filename', 'tags', 'arcoTags.label'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      }

      // Status filter
      if (filters.status) {
        filter.push({ term: { status: filters.status } });
      }

      // Creator filter
      if (filters.creatorId) {
        filter.push({ term: { creatorId: filters.creatorId } });
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        filter.push({ terms: { tags: filters.tags } });
      }

      // ArCo category filter
      if (filters.arcoCategories && filters.arcoCategories.length > 0) {
        filter.push({
          nested: {
            path: 'arcoTags',
            query: {
              terms: { 'arcoTags.category': filters.arcoCategories },
            },
          },
        });
      }

      // ArCo URI filter
      if (filters.arcoUris && filters.arcoUris.length > 0) {
        filter.push({
          nested: {
            path: 'arcoTags',
            query: {
              terms: { 'arcoTags.uri': filters.arcoUris },
            },
          },
        });
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const range: any = {};
        if (filters.dateFrom) range.gte = filters.dateFrom;
        if (filters.dateTo) range.lte = filters.dateTo;
        filter.push({ range: { createdAt: range } });
      }

      // MIME type filter
      if (filters.mimeTypes && filters.mimeTypes.length > 0) {
        filter.push({ terms: { mimeType: filters.mimeTypes } });
      }

      // Build sort
      const sort: any[] = [];
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';

      if (sortBy === 'relevance' && filters.query) {
        sort.push({ _score: { order: 'desc' } });
      } else if (sortBy === 'title') {
        sort.push({ 'title.keyword': { order: sortOrder } });
      } else if (sortBy === 'fileSize') {
        sort.push({ fileSize: { order: sortOrder } });
      } else {
        sort.push({ createdAt: { order: sortOrder } });
      }

      // Execute search
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
              filter,
            },
          },
          sort,
          from,
          size: limit,
          aggs: {
            statuses: {
              terms: { field: 'status', size: 10 },
            },
            mimeTypes: {
              terms: { field: 'mimeType', size: 20 },
            },
            arcoCategories: {
              nested: { path: 'arcoTags' },
              aggs: {
                categories: {
                  terms: { field: 'arcoTags.category', size: 10 },
                },
              },
            },
          },
        },
      });

      const total = typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0;

      const items = response.hits.hits.map((hit: any) => hit._source as SearchAssetDocument);

      return {
        items,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        aggregations: {
          statuses: response.aggregations?.statuses?.buckets?.map((b: any) => ({
            key: b.key,
            count: b.doc_count,
          })) || [],
          mimeTypes: response.aggregations?.mimeTypes?.buckets?.map((b: any) => ({
            key: b.key,
            count: b.doc_count,
          })) || [],
          arcoCategories: response.aggregations?.arcoCategories?.categories?.buckets?.map((b: any) => ({
            key: b.key,
            count: b.doc_count,
          })) || [],
        },
      };
    } catch (error) {
      logger.error('Search failed:', error);
      throw new InternalServerError('Search operation failed');
    }
  }

  /**
   * Get suggestions for autocomplete
   */
  async getSuggestions(field: string, prefix: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          aggs: {
            suggestions: {
              terms: {
                field: `${field}.keyword`,
                include: `${prefix}.*`,
                size: limit,
              },
            },
          },
        },
      });

      return response.aggregations?.suggestions?.buckets?.map((b: any) => b.key) || [];
    } catch (error) {
      logger.error('Get suggestions failed:', error);
      return [];
    }
  }

  /**
   * Reindex all assets
   */
  async reindexAll(assets: any[]): Promise<void> {
    try {
      logger.info(`Starting reindex of ${assets.length} assets`);

      // Delete and recreate index
      const exists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (exists) {
        await this.client.indices.delete({ index: this.indexName });
        logger.info(`Deleted existing index '${this.indexName}'`);
      }

      await this.initializeIndex();

      // Bulk index all assets
      if (assets.length > 0) {
        await this.bulkIndexAssets(assets);
      }

      logger.info(`Reindex completed: ${assets.length} assets`);
    } catch (error) {
      logger.error('Reindex failed:', error);
      throw new InternalServerError('Failed to reindex assets');
    }
  }
}
