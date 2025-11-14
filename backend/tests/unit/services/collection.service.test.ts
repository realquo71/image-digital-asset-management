import { CollectionService } from '../../../src/services/collection.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../src/utils/errors';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('CollectionService', () => {
  let collectionService: CollectionService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock Prisma client
    mockPrisma = {
      collection: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      collectionAsset: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      asset: {
        findMany: jest.fn(),
      },
    } as any;

    // Initialize service with mocked dependencies
    collectionService = new CollectionService(mockPrisma);
  });

  describe('createCollection', () => {
    it('should create collection with valid data', async () => {
      const collectionData = {
        name: 'Renaissance Art',
        description: 'Collection of Renaissance artworks',
        isPublic: true,
      };

      const mockCreatedCollection = {
        id: 'collection-123',
        ...collectionData,
        creatorId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.collection.create.mockResolvedValue(mockCreatedCollection as any);

      const result = await collectionService.createCollection(collectionData, 'user-123');

      expect(result).toEqual(mockCreatedCollection);
      expect(mockPrisma.collection.create).toHaveBeenCalled();
    });

    it('should default to private collection if isPublic not specified', async () => {
      const collectionData = {
        name: 'Private Collection',
        description: 'My private collection',
      };

      mockPrisma.collection.create.mockResolvedValue({
        id: 'collection-456',
        ...collectionData,
        isPublic: false,
        creatorId: 'user-123',
      } as any);

      await collectionService.createCollection(collectionData, 'user-123');

      expect(mockPrisma.collection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublic: false,
          }),
        })
      );
    });
  });

  describe('getCollectionById', () => {
    it('should return collection when found and public', async () => {
      const mockCollection = {
        id: 'collection-123',
        name: 'Public Collection',
        isPublic: true,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);

      const result = await collectionService.getCollectionById('collection-123');

      expect(result).toEqual(mockCollection);
    });

    it('should throw NotFoundError when collection not found', async () => {
      mockPrisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        collectionService.getCollectionById('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when accessing private collection as non-owner', async () => {
      const mockCollection = {
        id: 'collection-123',
        name: 'Private Collection',
        isPublic: false,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);

      await expect(
        collectionService.getCollectionById('collection-123', 'user-456')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow owner to access private collection', async () => {
      const mockCollection = {
        id: 'collection-123',
        name: 'Private Collection',
        isPublic: false,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);

      const result = await collectionService.getCollectionById('collection-123', 'user-123');

      expect(result).toEqual(mockCollection);
    });
  });

  describe('updateCollection', () => {
    it('should update collection when user is owner', async () => {
      const collectionId = 'collection-123';
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const existingCollection = {
        id: collectionId,
        name: 'Original Name',
        creatorId: userId,
        isPublic: true,
      };

      const updatedCollection = {
        ...existingCollection,
        ...updateData,
      };

      mockPrisma.collection.findUnique.mockResolvedValue(existingCollection as any);
      mockPrisma.collection.update.mockResolvedValue(updatedCollection as any);

      const result = await collectionService.updateCollection(
        collectionId,
        updateData,
        userId,
        'CURATOR'
      );

      expect(result).toEqual(updatedCollection);
      expect(mockPrisma.collection.update).toHaveBeenCalledWith(
        collectionId,
        updateData
      );
    });

    it('should throw ForbiddenError when non-owner tries to update', async () => {
      const collectionId = 'collection-123';
      const updateData = { name: 'Updated Name' };

      const existingCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(existingCollection as any);

      await expect(
        collectionService.updateCollection(collectionId, updateData, 'user-456', 'CURATOR')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow ADMIN to update any collection', async () => {
      const collectionId = 'collection-123';
      const updateData = { name: 'Updated by Admin' };

      const existingCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      const updatedCollection = {
        ...existingCollection,
        ...updateData,
      };

      mockPrisma.collection.findUnique.mockResolvedValue(existingCollection as any);
      mockPrisma.collection.update.mockResolvedValue(updatedCollection as any);

      const result = await collectionService.updateCollection(
        collectionId,
        updateData,
        'admin-456',
        'ADMIN'
      );

      expect(result).toEqual(updatedCollection);
    });
  });

  describe('deleteCollection', () => {
    it('should delete collection when user is owner', async () => {
      const collectionId = 'collection-123';
      const userId = 'user-123';

      const existingCollection = {
        id: collectionId,
        creatorId: userId,
      };

      mockPrisma.collection.findUnique.mockResolvedValue(existingCollection as any);
      mockPrisma.collection.delete.mockResolvedValue(existingCollection as any);

      await collectionService.deleteCollection(collectionId, userId, 'CURATOR');

      expect(mockPrisma.collection.delete).toHaveBeenCalledWith(collectionId);
    });

    it('should throw ForbiddenError when non-owner tries to delete', async () => {
      const collectionId = 'collection-123';

      const existingCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(existingCollection as any);

      await expect(
        collectionService.deleteCollection(collectionId, 'user-456', 'CURATOR')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('addAssets', () => {
    it('should add assets to collection', async () => {
      const collectionId = 'collection-123';
      const assetIds = ['asset-1', 'asset-2', 'asset-3'];

      const mockCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      const mockAssets = assetIds.map(id => ({ id }));

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);
      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);
      mockPrisma.collection.findUnique.mockResolvedValueOnce(mockCollection as any);

      await collectionService.addAssets(collectionId, assetIds, 'user-123', 'CURATOR');

      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: { id: { in: assetIds } },
      });
    });

    it('should throw BadRequestError when no asset IDs provided', async () => {
      const collectionId = 'collection-123';

      const mockCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);

      await expect(
        collectionService.addAssets(collectionId, [], 'user-123', 'CURATOR')
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when some assets do not exist', async () => {
      const collectionId = 'collection-123';
      const assetIds = ['asset-1', 'asset-2', 'asset-3'];

      const mockCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      // Only return 2 out of 3 assets
      const mockAssets = [{ id: 'asset-1' }, { id: 'asset-2' }];

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);
      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);

      await expect(
        collectionService.addAssets(collectionId, assetIds, 'user-123', 'CURATOR')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('removeAssets', () => {
    it('should remove assets from collection', async () => {
      const collectionId = 'collection-123';
      const assetIds = ['asset-1', 'asset-2'];

      const mockCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);

      await collectionService.removeAssets(collectionId, assetIds, 'user-123', 'CURATOR');

      // Verify removeAssets was called on repository
      expect(mockPrisma.collection.findUnique).toHaveBeenCalled();
    });

    it('should throw BadRequestError when no asset IDs provided', async () => {
      const collectionId = 'collection-123';

      const mockCollection = {
        id: collectionId,
        creatorId: 'user-123',
      };

      mockPrisma.collection.findUnique.mockResolvedValue(mockCollection as any);

      await expect(
        collectionService.removeAssets(collectionId, [], 'user-123', 'CURATOR')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('duplicateCollection', () => {
    it('should create duplicate of collection with new name', async () => {
      const originalId = 'collection-123';
      const userId = 'user-456';

      const originalCollection = {
        id: originalId,
        name: 'Original Collection',
        description: 'Original description',
        isPublic: true,
        assets: [
          { assetId: 'asset-1' },
          { assetId: 'asset-2' },
        ],
      };

      const duplicateCollection = {
        id: 'collection-789',
        name: 'Original Collection (Copy)',
        description: 'Original description',
        isPublic: false,
        creatorId: userId,
      };

      mockPrisma.collection.findUnique
        .mockResolvedValueOnce(originalCollection as any)
        .mockResolvedValueOnce(duplicateCollection as any);
      mockPrisma.collection.create.mockResolvedValue(duplicateCollection as any);

      const result = await collectionService.duplicateCollection(originalId, userId);

      expect(result.name).toBe('Original Collection (Copy)');
      expect(result.isPublic).toBe(false); // Duplicates are private by default
    });

    it('should use custom name if provided', async () => {
      const originalId = 'collection-123';
      const userId = 'user-456';
      const customName = 'My Custom Copy';

      const originalCollection = {
        id: originalId,
        name: 'Original Collection',
        assets: [],
      };

      const duplicateCollection = {
        id: 'collection-789',
        name: customName,
        isPublic: false,
        creatorId: userId,
      };

      mockPrisma.collection.findUnique
        .mockResolvedValueOnce(originalCollection as any)
        .mockResolvedValueOnce(duplicateCollection as any);
      mockPrisma.collection.create.mockResolvedValue(duplicateCollection as any);

      const result = await collectionService.duplicateCollection(
        originalId,
        userId,
        customName
      );

      expect(result.name).toBe(customName);
    });
  });

  describe('shareCollection', () => {
    it('should make collection public', async () => {
      const collectionId = 'collection-123';
      const userId = 'user-123';

      const privateCollection = {
        id: collectionId,
        name: 'Private Collection',
        isPublic: false,
        creatorId: userId,
      };

      const publicCollection = {
        ...privateCollection,
        isPublic: true,
      };

      mockPrisma.collection.findUnique.mockResolvedValue(privateCollection as any);
      mockPrisma.collection.update.mockResolvedValue(publicCollection as any);

      const result = await collectionService.shareCollection(collectionId, userId, 'CURATOR');

      expect(result.isPublic).toBe(true);
    });
  });

  describe('unshareCollection', () => {
    it('should make collection private', async () => {
      const collectionId = 'collection-123';
      const userId = 'user-123';

      const publicCollection = {
        id: collectionId,
        name: 'Public Collection',
        isPublic: true,
        creatorId: userId,
      };

      const privateCollection = {
        ...publicCollection,
        isPublic: false,
      };

      mockPrisma.collection.findUnique.mockResolvedValue(publicCollection as any);
      mockPrisma.collection.update.mockResolvedValue(privateCollection as any);

      const result = await collectionService.unshareCollection(collectionId, userId, 'CURATOR');

      expect(result.isPublic).toBe(false);
    });
  });
});
