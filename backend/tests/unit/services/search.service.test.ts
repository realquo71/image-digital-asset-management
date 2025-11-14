import { SearchService } from '../../../src/services/search.service';
import { Client } from '@elastic/elasticsearch';

// Mock Elasticsearch client
jest.mock('@elastic/elasticsearch');
jest.mock('../../../src/config/elasticsearch', () => ({
  getElasticsearchClient: jest.fn(),
}));

describe('SearchService', () => {
  let searchService: SearchService;
  let mockElasticsearchClient: jest.Mocked<Client>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock Elasticsearch client
    mockElasticsearchClient = {
      indices: {
        exists: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      index: jest.fn(),
      bulk: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    } as any;

    // Mock getElasticsearchClient to return mock client
    const { getElasticsearchClient } = require('../../../src/config/elasticsearch');
    getElasticsearchClient.mockReturnValue(mockElasticsearchClient);

    searchService = new SearchService();
  });

  describe('initializeIndex', () => {
    it('should create index if it does not exist', async () => {
      mockElasticsearchClient.indices.exists.mockResolvedValue(false);
      mockElasticsearchClient.indices.create.mockResolvedValue({} as any);

      await searchService.initializeIndex();

      expect(mockElasticsearchClient.indices.exists).toHaveBeenCalledWith({
        index: 'assets',
      });
      expect(mockElasticsearchClient.indices.create).toHaveBeenCalled();
    });

    it('should not create index if it already exists', async () => {
      mockElasticsearchClient.indices.exists.mockResolvedValue(true);

      await searchService.initializeIndex();

      expect(mockElasticsearchClient.indices.exists).toHaveBeenCalled();
      expect(mockElasticsearchClient.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('indexAsset', () => {
    it('should index asset with all metadata', async () => {
      const mockAsset = {
        id: 'asset-123',
        title: 'Test Asset',
        description: 'Test description',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        status: 'PUBLISHED',
        creatorId: 'user-123',
        creator: {
          name: 'Test User',
          email: 'test@example.com',
        },
        tags: [
          { tag: { name: 'sculpture' } },
          { tag: { name: 'renaissance' } },
        ],
        arcoTags: [
          {
            arcoUri: 'https://w3id.org/arco/resource/CulturalPropertyType/scultura',
            label: 'Scultura',
            category: 'CULTURAL_PROPERTY_TYPE',
            notation: 'S',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        width: 3000,
        height: 4000,
        camera: 'Canon EOS 5D',
        captureDate: new Date(),
      };

      mockElasticsearchClient.index.mockResolvedValue({} as any);

      await searchService.indexAsset(mockAsset);

      expect(mockElasticsearchClient.index).toHaveBeenCalledWith({
        index: 'assets',
        id: 'asset-123',
        document: expect.objectContaining({
          id: 'asset-123',
          title: 'Test Asset',
          tags: ['sculpture', 'renaissance'],
          arcoTags: expect.arrayContaining([
            expect.objectContaining({
              uri: 'https://w3id.org/arco/resource/CulturalPropertyType/scultura',
              label: 'Scultura',
            }),
          ]),
        }),
      });
    });

    it('should handle indexing errors gracefully', async () => {
      const mockAsset = {
        id: 'asset-123',
        title: 'Test Asset',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        status: 'DRAFT',
        creatorId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockElasticsearchClient.index.mockRejectedValue(new Error('Elasticsearch error'));

      // Should not throw - indexing failures shouldn't break asset operations
      await expect(searchService.indexAsset(mockAsset)).resolves.not.toThrow();
    });
  });

  describe('bulkIndexAssets', () => {
    it('should bulk index multiple assets', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          title: 'Asset 1',
          filename: 'asset1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'PUBLISHED',
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'asset-2',
          title: 'Asset 2',
          filename: 'asset2.jpg',
          mimeType: 'image/jpeg',
          fileSize: 2048,
          status: 'PUBLISHED',
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockElasticsearchClient.bulk.mockResolvedValue({
        errors: false,
        items: [],
      } as any);

      await searchService.bulkIndexAssets(mockAssets);

      expect(mockElasticsearchClient.bulk).toHaveBeenCalledWith({
        operations: expect.any(Array),
        refresh: true,
      });
    });

    it('should handle empty asset array', async () => {
      await searchService.bulkIndexAssets([]);

      expect(mockElasticsearchClient.bulk).not.toHaveBeenCalled();
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset from index', async () => {
      mockElasticsearchClient.delete.mockResolvedValue({} as any);

      await searchService.deleteAsset('asset-123');

      expect(mockElasticsearchClient.delete).toHaveBeenCalledWith({
        index: 'assets',
        id: 'asset-123',
      });
    });

    it('should handle 404 errors gracefully', async () => {
      mockElasticsearchClient.delete.mockRejectedValue({
        meta: { statusCode: 404 },
      });

      // Should not throw on 404
      await expect(searchService.deleteAsset('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('searchAssets', () => {
    it('should perform full-text search', async () => {
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: {
                id: 'asset-123',
                title: 'Michelangelo David',
                description: 'Renaissance sculpture',
                status: 'PUBLISHED',
              },
            },
          ],
        },
        aggregations: {
          statuses: { buckets: [{ key: 'PUBLISHED', doc_count: 1 }] },
          mimeTypes: { buckets: [{ key: 'image/jpeg', doc_count: 1 }] },
          arcoCategories: {
            categories: { buckets: [{ key: 'CULTURAL_PROPERTY_TYPE', doc_count: 1 }] },
          },
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockResponse as any);

      const result = await searchService.searchAssets({
        query: 'Michelangelo',
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('Michelangelo David');
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'assets',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    query: 'Michelangelo',
                    fields: expect.arrayContaining(['title^3', 'description^2']),
                  }),
                }),
              ]),
            }),
          }),
        }),
      });
    });

    it('should filter by status', async () => {
      const mockResponse = {
        hits: { total: { value: 0 }, hits: [] },
        aggregations: {
          statuses: { buckets: [] },
          mimeTypes: { buckets: [] },
          arcoCategories: { categories: { buckets: [] } },
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockResponse as any);

      await searchService.searchAssets({
        status: 'DRAFT',
        page: 1,
        limit: 20,
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'assets',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { status: 'DRAFT' } },
              ]),
            }),
          }),
        }),
      });
    });

    it('should filter by ArCo categories', async () => {
      const mockResponse = {
        hits: { total: { value: 0 }, hits: [] },
        aggregations: {
          statuses: { buckets: [] },
          mimeTypes: { buckets: [] },
          arcoCategories: { categories: { buckets: [] } },
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockResponse as any);

      await searchService.searchAssets({
        arcoCategories: ['CULTURAL_PROPERTY_TYPE', 'MATERIAL'],
        page: 1,
        limit: 20,
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'assets',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                expect.objectContaining({
                  nested: expect.objectContaining({
                    path: 'arcoTags',
                    query: expect.objectContaining({
                      terms: { 'arcoTags.category': ['CULTURAL_PROPERTY_TYPE', 'MATERIAL'] },
                    }),
                  }),
                }),
              ]),
            }),
          }),
        }),
      });
    });

    it('should apply pagination correctly', async () => {
      const mockResponse = {
        hits: { total: { value: 100 }, hits: [] },
        aggregations: {
          statuses: { buckets: [] },
          mimeTypes: { buckets: [] },
          arcoCategories: { categories: { buckets: [] } },
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockResponse as any);

      const result = await searchService.searchAssets({
        page: 3,
        limit: 20,
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.pages).toBe(5); // 100 total / 20 limit
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'assets',
        body: expect.objectContaining({
          from: 40, // (page 3 - 1) * 20
          size: 20,
        }),
      });
    });

    it('should sort by title when specified', async () => {
      const mockResponse = {
        hits: { total: { value: 0 }, hits: [] },
        aggregations: {
          statuses: { buckets: [] },
          mimeTypes: { buckets: [] },
          arcoCategories: { categories: { buckets: [] } },
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockResponse as any);

      await searchService.searchAssets({
        sortBy: 'title',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'assets',
        body: expect.objectContaining({
          sort: [{ 'title.keyword': { order: 'asc' } }],
        }),
      });
    });
  });

  describe('getSuggestions', () => {
    it('should return autocomplete suggestions', async () => {
      const mockResponse = {
        aggregations: {
          suggestions: {
            buckets: [
              { key: 'Renaissance' },
              { key: 'Rembrandt' },
            ],
          },
        },
      };

      mockElasticsearchClient.search.mockResolvedValue(mockResponse as any);

      const result = await searchService.getSuggestions('title', 'Ren', 10);

      expect(result).toEqual(['Renaissance', 'Rembrandt']);
    });

    it('should handle errors gracefully', async () => {
      mockElasticsearchClient.search.mockRejectedValue(new Error('Search error'));

      const result = await searchService.getSuggestions('title', 'test', 10);

      expect(result).toEqual([]);
    });
  });

  describe('reindexAll', () => {
    it('should delete existing index and recreate with assets', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          title: 'Asset 1',
          filename: 'asset1.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          status: 'PUBLISHED',
          creatorId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockElasticsearchClient.indices.exists.mockResolvedValue(true);
      mockElasticsearchClient.indices.delete.mockResolvedValue({} as any);
      mockElasticsearchClient.indices.create.mockResolvedValue({} as any);
      mockElasticsearchClient.bulk.mockResolvedValue({
        errors: false,
        items: [],
      } as any);

      await searchService.reindexAll(mockAssets);

      expect(mockElasticsearchClient.indices.delete).toHaveBeenCalled();
      expect(mockElasticsearchClient.indices.create).toHaveBeenCalled();
      expect(mockElasticsearchClient.bulk).toHaveBeenCalled();
    });
  });
});
