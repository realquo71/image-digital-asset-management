import { AssetService } from '../../../src/services/asset.service';

// Mock Prisma Client and dependencies
jest.mock('@prisma/client');
jest.mock('../../../src/services/storage/sharepoint.service');
jest.mock('../../../src/services/image-processing.service');
jest.mock('../../../src/repositories/asset.repository');

describe('AssetService', () => {
  let assetService: AssetService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      asset: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      tag: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      arcoTag: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    assetService = new AssetService(mockPrisma);
  });

  describe('getAssetById', () => {
    it('should return asset when found', async () => {
      const mockAsset = {
        id: 'asset-123',
        title: 'Test Asset',
        status: 'PUBLISHED',
        creatorId: 'user-123',
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(mockAsset);

      const result = await assetService.getAssetById('asset-123');

      expect(result).toEqual(mockAsset);
      expect(mockRepository.findById).toHaveBeenCalledWith('asset-123');
    });

    it('should throw NotFoundError when asset not found', async () => {
      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        assetService.getAssetById('nonexistent')
      ).rejects.toThrow("Asset with identifier 'nonexistent' not found");
    });

    it('should throw ForbiddenError when VIEWER tries to access DRAFT asset', async () => {
      const mockAsset = {
        id: 'asset-123',
        title: 'Draft Asset',
        status: 'DRAFT',
        creatorId: 'user-123',
      };

      const mockUser = {
        id: 'viewer-456',
        role: 'VIEWER',
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(mockAsset);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        assetService.getAssetById('asset-123', 'viewer-456')
      ).rejects.toThrow('You do not have permission to view this asset');
    });
  });

  describe('listAssets', () => {
    it('should return paginated assets', async () => {
      const mockAssets = [
        { id: '1', title: 'Asset 1', status: 'PUBLISHED' },
        { id: '2', title: 'Asset 2', status: 'PUBLISHED' },
      ];

      const mockResult = {
        items: mockAssets,
        meta: { page: 1, limit: 20, total: 2, pages: 1 },
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findMany = jest.fn().mockResolvedValue(mockResult);

      const result = await assetService.listAssets({ page: 1, limit: 20 });

      expect(result.items).toEqual(mockAssets);
      expect(result.meta.total).toBe(2);
    });

    it('should filter to PUBLISHED for VIEWER role', async () => {
      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findMany = jest.fn().mockResolvedValue({
        items: [],
        meta: { page: 1, limit: 20, total: 0, pages: 0 },
      });

      const filters: any = { page: 1, limit: 20 };
      await assetService.listAssets(filters, 'user-123', 'VIEWER');

      expect(filters.status).toBe('PUBLISHED');
      expect(mockRepository.findMany).toHaveBeenCalled();
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
        status: 'DRAFT',
      };

      const updatedAsset = {
        ...existingAsset,
        ...updateData,
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(existingAsset);
      mockRepository.update = jest.fn().mockResolvedValue(updatedAsset);

      const result = await assetService.updateAsset(
        assetId,
        updateData,
        userId,
        'CURATOR'
      );

      expect(result.title).toBe('Updated Title');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when non-owner curator tries to update', async () => {
      const assetId = 'asset-123';
      const updateData = { title: 'Updated Title' };

      const existingAsset = {
        id: assetId,
        creatorId: 'user-123',
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(existingAsset);

      await expect(
        assetService.updateAsset(assetId, updateData, 'user-456', 'CURATOR')
      ).rejects.toThrow('You do not have permission to edit this asset');
    });

    it('should allow ADMIN to update any asset', async () => {
      const assetId = 'asset-123';
      const updateData = { title: 'Admin Updated' };

      const existingAsset = {
        id: assetId,
        creatorId: 'user-123',
        status: 'DRAFT',
      };

      const updatedAsset = {
        ...existingAsset,
        ...updateData,
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(existingAsset);
      mockRepository.update = jest.fn().mockResolvedValue(updatedAsset);

      const result = await assetService.updateAsset(
        assetId,
        updateData,
        'admin-456',
        'ADMIN'
      );

      expect(result.title).toBe('Admin Updated');
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

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(existingAsset);
      mockRepository.delete = jest.fn().mockResolvedValue(undefined);

      const mockStorage = assetService['storageService'] as any;
      mockStorage.deleteFile = jest.fn().mockResolvedValue(undefined);

      await assetService.deleteAsset(assetId, userId, 'CURATOR');

      expect(mockRepository.delete).toHaveBeenCalledWith(assetId);
    });

    it('should throw ForbiddenError when non-owner tries to delete', async () => {
      const assetId = 'asset-123';

      const existingAsset = {
        id: assetId,
        creatorId: 'user-123',
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(existingAsset);

      await expect(
        assetService.deleteAsset(assetId, 'user-456', 'CURATOR')
      ).rejects.toThrow('You do not have permission to delete this asset');
    });

    it('should allow ADMIN to delete any asset', async () => {
      const assetId = 'asset-123';

      const existingAsset = {
        id: assetId,
        creatorId: 'user-123',
      };

      const mockRepository = assetService['assetRepository'] as any;
      mockRepository.findById = jest.fn().mockResolvedValue(existingAsset);
      mockRepository.delete = jest.fn().mockResolvedValue(undefined);

      const mockStorage = assetService['storageService'] as any;
      mockStorage.deleteFile = jest.fn().mockResolvedValue(undefined);

      await assetService.deleteAsset(assetId, 'admin-456', 'ADMIN');

      expect(mockRepository.delete).toHaveBeenCalled();
    });
  });
});
