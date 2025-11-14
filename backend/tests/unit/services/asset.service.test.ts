import { AssetService } from '../../../src/services/asset.service';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError, UnauthorizedError } from '../../../src/utils/errors';

// Mock Prisma Client
jest.mock('@prisma/client');

describe('AssetService', () => {
  let assetService: AssetService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock Prisma client
    mockPrisma = {
      asset: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      tag: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      arcoTag: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as any;

    // Initialize service with mocked dependencies
    assetService = new AssetService(mockPrisma);
  });

  describe('getAssets', () => {
    it('should return paginated assets', async () => {
      const mockAssets = [
        {
          id: '1',
          title: 'Test Asset 1',
          filename: 'test1.jpg',
          status: 'PUBLISHED',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Test Asset 2',
          filename: 'test2.jpg',
          status: 'PUBLISHED',
          createdAt: new Date(),
        },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets as any);
      mockPrisma.asset.count.mockResolvedValue(2);

      const result = await assetService.getAssets({ page: 1, limit: 20 });

      expect(result.assets).toEqual(mockAssets);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      });
      expect(mockPrisma.asset.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.asset.count).toHaveBeenCalledTimes(1);
    });

    it('should filter assets by status', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([]);
      mockPrisma.asset.count.mockResolvedValue(0);

      await assetService.getAssets({ page: 1, limit: 20, status: 'DRAFT' });

      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should filter assets by creator', async () => {
      const creatorId = 'user-123';
      mockPrisma.asset.findMany.mockResolvedValue([]);
      mockPrisma.asset.count.mockResolvedValue(0);

      await assetService.getAssets({ page: 1, limit: 20, creatorId });

      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            creatorId,
          }),
        })
      );
    });
  });

  describe('getAssetById', () => {
    it('should return asset when found', async () => {
      const mockAsset = {
        id: 'asset-123',
        title: 'Test Asset',
        status: 'PUBLISHED',
      };

      mockPrisma.asset.findUnique.mockResolvedValue(mockAsset as any);

      const result = await assetService.getAssetById('asset-123');

      expect(result).toEqual(mockAsset);
      expect(mockPrisma.asset.findUnique).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError when asset not found', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue(null);

      await expect(assetService.getAssetById('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('createAsset', () => {
    it('should create asset with valid data', async () => {
      const assetData = {
        title: 'New Asset',
        description: 'Test description',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        status: 'DRAFT',
        sharepointUrl: 'https://sharepoint.com/test.jpg',
        creatorId: 'user-123',
      };

      const mockCreatedAsset = {
        id: 'new-asset-123',
        ...assetData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.asset.create.mockResolvedValue(mockCreatedAsset as any);

      const result = await assetService.createAsset(assetData);

      expect(result).toEqual(mockCreatedAsset);
      expect(mockPrisma.asset.create).toHaveBeenCalledWith({
        data: assetData,
        include: expect.any(Object),
      });
    });

    it('should throw ValidationError with invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        filename: 'test.jpg',
      };

      await expect(assetService.createAsset(invalidData as any)).rejects.toThrow();
    });
  });

  describe('updateAsset', () => {
    it('should update asset when user is owner', async () => {
      const assetId = 'asset-123';
      const userId = 'user-123';
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const existingAsset = {
        id: assetId,
        title: 'Original Title',
        creatorId: userId,
      };

      const updatedAsset = {
        ...existingAsset,
        ...updateData,
      };

      mockPrisma.asset.findUnique.mockResolvedValue(existingAsset as any);
      mockPrisma.asset.update.mockResolvedValue(updatedAsset as any);

      const result = await assetService.updateAsset(assetId, updateData, userId, 'CURATOR');

      expect(result).toEqual(updatedAsset);
      expect(mockPrisma.asset.update).toHaveBeenCalledWith({
        where: { id: assetId },
        data: updateData,
        include: expect.any(Object),
      });
    });

    it('should throw UnauthorizedError when user is not owner', async () => {
      const assetId = 'asset-123';
      const userId = 'user-456'; // Different user
      const updateData = { title: 'Updated Title' };

      const existingAsset = {
        id: assetId,
        creatorId: 'user-123', // Original owner
      };

      mockPrisma.asset.findUnique.mockResolvedValue(existingAsset as any);

      await expect(
        assetService.updateAsset(assetId, updateData, userId, 'CURATOR')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should allow ADMIN to update any asset', async () => {
      const assetId = 'asset-123';
      const adminId = 'admin-456';
      const updateData = { title: 'Updated by Admin' };

      const existingAsset = {
        id: assetId,
        creatorId: 'user-123', // Different owner
      };

      const updatedAsset = {
        ...existingAsset,
        ...updateData,
      };

      mockPrisma.asset.findUnique.mockResolvedValue(existingAsset as any);
      mockPrisma.asset.update.mockResolvedValue(updatedAsset as any);

      const result = await assetService.updateAsset(assetId, updateData, adminId, 'ADMIN');

      expect(result).toEqual(updatedAsset);
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset when user is owner', async () => {
      const assetId = 'asset-123';
      const userId = 'user-123';

      const existingAsset = {
        id: assetId,
        creatorId: userId,
      };

      mockPrisma.asset.findUnique.mockResolvedValue(existingAsset as any);
      mockPrisma.asset.delete.mockResolvedValue(existingAsset as any);

      await assetService.deleteAsset(assetId, userId, 'CURATOR');

      expect(mockPrisma.asset.delete).toHaveBeenCalledWith({
        where: { id: assetId },
      });
    });

    it('should throw UnauthorizedError when user is not owner', async () => {
      const assetId = 'asset-123';
      const userId = 'user-456';

      const existingAsset = {
        id: assetId,
        creatorId: 'user-123',
      };

      mockPrisma.asset.findUnique.mockResolvedValue(existingAsset as any);

      await expect(assetService.deleteAsset(assetId, userId, 'CURATOR')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('addTagToAsset', () => {
    it('should create and add new tag to asset', async () => {
      const assetId = 'asset-123';
      const tagName = 'Renaissance';

      mockPrisma.tag.findFirst.mockResolvedValue(null); // Tag doesn't exist
      mockPrisma.tag.create.mockResolvedValue({
        id: 'tag-123',
        name: tagName,
      } as any);

      const result = await assetService.addTagToAsset(assetId, tagName);

      expect(mockPrisma.tag.findFirst).toHaveBeenCalledWith({
        where: { name: tagName },
      });
      expect(mockPrisma.tag.create).toHaveBeenCalled();
      expect(result.name).toBe(tagName);
    });

    it('should use existing tag if already exists', async () => {
      const assetId = 'asset-123';
      const tagName = 'Renaissance';
      const existingTag = {
        id: 'tag-existing',
        name: tagName,
      };

      mockPrisma.tag.findFirst.mockResolvedValue(existingTag as any);

      const result = await assetService.addTagToAsset(assetId, tagName);

      expect(mockPrisma.tag.findFirst).toHaveBeenCalled();
      expect(mockPrisma.tag.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingTag);
    });
  });

  describe('addArcoTagToAsset', () => {
    it('should add ArCo semantic tag to asset', async () => {
      const assetId = 'asset-123';
      const arcoData = {
        arcoUri: 'https://w3id.org/arco/resource/CulturalPropertyType/scultura',
        category: 'CULTURAL_PROPERTY_TYPE',
        label: 'Scultura',
        notation: 'S',
      };

      const mockArcoTag = {
        ...arcoData,
        assetId,
      };

      mockPrisma.arcoTag.create.mockResolvedValue(mockArcoTag as any);

      const result = await assetService.addArcoTagToAsset(assetId, arcoData);

      expect(result).toEqual(mockArcoTag);
      expect(mockPrisma.arcoTag.create).toHaveBeenCalledWith({
        data: {
          ...arcoData,
          assetId,
        },
      });
    });
  });

  describe('removeArcoTagFromAsset', () => {
    it('should remove ArCo tag from asset', async () => {
      const assetId = 'asset-123';
      const arcoUri = 'https://w3id.org/arco/resource/CulturalPropertyType/scultura';

      mockPrisma.arcoTag.deleteMany.mockResolvedValue({ count: 1 } as any);

      await assetService.removeArcoTagFromAsset(assetId, arcoUri);

      expect(mockPrisma.arcoTag.deleteMany).toHaveBeenCalledWith({
        where: {
          assetId,
          arcoUri,
        },
      });
    });
  });
});
