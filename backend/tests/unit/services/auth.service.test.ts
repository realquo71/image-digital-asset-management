import { AuthService } from '../../../src/services/auth.service';
import { PrismaClient, UserRole } from '@prisma/client';
import { UnauthorizedError } from '../../../src/utils/errors';
import jwt from 'jsonwebtoken';
import { ConfidentialClientApplication } from '@azure/msal-node';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('jsonwebtoken');
jest.mock('@azure/msal-node');
jest.mock('../../../src/config', () => ({
  config: {
    azure: {
      clientId: 'test-client-id',
      tenantId: 'test-tenant-id',
      clientSecret: 'test-client-secret',
    },
    jwt: {
      secret: 'test-jwt-secret',
      expiresIn: '24h',
      refreshExpiresIn: '30d',
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockMsalClient: jest.Mocked<ConfidentialClientApplication>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock Prisma client
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    } as any;

    // Create mock MSAL client
    mockMsalClient = {
      getAuthCodeUrl: jest.fn(),
      acquireTokenByCode: jest.fn(),
    } as any;

    // Mock MSAL constructor
    (ConfidentialClientApplication as jest.MockedClass<typeof ConfidentialClientApplication>)
      .mockImplementation(() => mockMsalClient);

    authService = new AuthService(mockPrisma);
  });

  describe('getAuthorizationUrl', () => {
    it('should return Azure AD authorization URL', () => {
      const mockUrl = 'https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize?...';
      mockMsalClient.getAuthCodeUrl.mockReturnValue(mockUrl as any);

      const result = authService.getAuthorizationUrl('http://localhost:3001/auth/callback');

      expect(result).toBe(mockUrl);
      expect(mockMsalClient.getAuthCodeUrl).toHaveBeenCalledWith({
        scopes: ['user.read'],
        redirectUri: 'http://localhost:3001/auth/callback',
      });
    });
  });

  describe('handleAzureCallback', () => {
    it('should exchange code for tokens and create new user', async () => {
      const mockTokenResponse = {
        account: {
          username: 'newuser@example.com',
          name: 'New User',
          localAccountId: 'azure-ad-id-123',
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        name: 'New User',
        role: UserRole.ADMIN, // First user becomes admin
        azureAdId: 'azure-ad-id-123',
        isActive: true,
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockTokenResponse as any);
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      mockPrisma.user.count.mockResolvedValue(0); // No users yet
      mockPrisma.user.create.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await authService.handleAzureCallback(
        'auth-code-123',
        'http://localhost:3001/auth/callback'
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: 24 * 60 * 60,
        user: {
          id: 'user-123',
          email: 'newuser@example.com',
          name: 'New User',
          role: UserRole.ADMIN,
        },
      });

      expect(mockMsalClient.acquireTokenByCode).toHaveBeenCalledWith({
        code: 'auth-code-123',
        scopes: ['user.read'],
        redirectUri: 'http://localhost:3001/auth/callback',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          azureAdId: 'azure-ad-id-123',
          role: UserRole.ADMIN,
          isActive: true,
        },
      });
    });

    it('should return existing user if already registered', async () => {
      const mockTokenResponse = {
        account: {
          username: 'existinguser@example.com',
          name: 'Existing User',
          localAccountId: 'azure-ad-id-456',
        },
      };

      const existingUser = {
        id: 'user-456',
        email: 'existinguser@example.com',
        name: 'Existing User',
        role: UserRole.CURATOR,
        azureAdId: 'azure-ad-id-456',
        isActive: true,
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockTokenResponse as any);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as any);
      mockPrisma.user.update.mockResolvedValue(existingUser as any);

      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await authService.handleAzureCallback(
        'auth-code-123',
        'http://localhost:3001/auth/callback'
      );

      expect(result.user.id).toBe('user-456');
      expect(result.user.role).toBe(UserRole.CURATOR);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should assign VIEWER role to non-first users', async () => {
      const mockTokenResponse = {
        account: {
          username: 'seconduser@example.com',
          name: 'Second User',
          localAccountId: 'azure-ad-id-789',
        },
      };

      const newUser = {
        id: 'user-789',
        email: 'seconduser@example.com',
        name: 'Second User',
        role: UserRole.VIEWER,
        azureAdId: 'azure-ad-id-789',
        isActive: true,
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockTokenResponse as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(5); // Existing users
      mockPrisma.user.create.mockResolvedValue(newUser as any);
      mockPrisma.user.update.mockResolvedValue(newUser as any);

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.handleAzureCallback(
        'auth-code-123',
        'http://localhost:3001/auth/callback'
      );

      expect(result.user.role).toBe(UserRole.VIEWER);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.VIEWER,
        }),
      });
    });

    it('should throw UnauthorizedError if token acquisition fails', async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue(null as any);

      await expect(
        authService.handleAzureCallback('invalid-code', 'http://localhost:3001/auth/callback')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token from valid refresh token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CURATOR,
        isActive: true,
      };

      const mockDecodedToken = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CURATOR,
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      (jwt.sign as jest.Mock).mockReturnValue('new-access-token');

      const result = await authService.refreshAccessToken('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 24 * 60 * 60,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.CURATOR,
        },
      });

      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-jwt-secret');
    });

    it('should throw UnauthorizedError for invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await expect(
        authService.refreshAccessToken('invalid-token')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for expired refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await expect(
        authService.refreshAccessToken('expired-token')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if user is inactive', async () => {
      const mockDecodedToken = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CURATOR,
      };

      const inactiveUser = {
        id: 'user-123',
        email: 'user@example.com',
        isActive: false,
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser as any);

      await expect(
        authService.refreshAccessToken('valid-refresh-token')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user info by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CURATOR,
        organization: 'Test Museum',
        department: 'Curation',
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await authService.getCurrentUser('user-123');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          role: true,
        }),
      });
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.getCurrentUser('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('JWT token generation', () => {
    it('should generate access token with correct payload', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.CURATOR,
        azureAdId: 'azure-id-123',
        isActive: true,
      };

      const mockTokenResponse = {
        account: {
          username: 'user@example.com',
          name: 'Test User',
          localAccountId: 'azure-id-123',
        },
      };

      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockTokenResponse as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await authService.handleAzureCallback('code', 'http://localhost:3001/auth/callback');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.CURATOR,
          azureAdId: 'azure-id-123',
        }),
        'test-jwt-secret',
        expect.objectContaining({
          expiresIn: '24h',
          issuer: 'dam-backend',
          audience: 'dam-frontend',
        })
      );
    });
  });
});
