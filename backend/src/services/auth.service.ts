// Authentication Service
// Handles Azure AD authentication and JWT token generation

import jwt from 'jsonwebtoken';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { config } from '../config';
import { UnauthorizedError, InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';
import { UserPayload } from '../types';
import { AuthResponse } from '../dto/auth.dto';

export class AuthService {
  private msalClient: ConfidentialClientApplication;

  constructor(private prisma: PrismaClient) {
    // Initialize MSAL client
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.azure.clientId,
        authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
        clientSecret: config.azure.clientSecret,
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (!containsPii) {
              logger.debug(`MSAL: ${message}`);
            }
          },
          piiLoggingEnabled: false,
          logLevel: 3, // Error level
        },
      },
    });
  }

  /**
   * Get Azure AD authorization URL
   */
  getAuthorizationUrl(redirectUri: string): string {
    const authCodeUrlParameters = {
      scopes: ['user.read'],
      redirectUri: redirectUri,
    };

    return this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleAzureCallback(code: string, redirectUri: string): Promise<AuthResponse> {
    try {
      // Exchange code for tokens
      const tokenResponse = await this.msalClient.acquireTokenByCode({
        code,
        scopes: ['user.read'],
        redirectUri,
      });

      if (!tokenResponse || !tokenResponse.account) {
        throw new UnauthorizedError('Failed to acquire token from Azure AD');
      }

      const { account } = tokenResponse;

      // Get or create user
      const user = await this.getOrCreateUser(
        account.username, // email
        account.name || account.username,
        account.localAccountId // Azure AD object ID
      );

      // Generate JWT tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Update last login
      await this.updateLastLogin(user.id);

      return {
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error('Azure AD callback error:', error);
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new InternalServerError('Authentication failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as UserPayload;

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return {
        accessToken,
        expiresIn: 24 * 60 * 60,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  /**
   * Get or create user from Azure AD account
   */
  private async getOrCreateUser(
    email: string,
    name: string,
    azureAdId: string
  ): Promise<User> {
    // Try to find existing user by Azure AD ID
    let user = await this.prisma.user.findUnique({
      where: { azureAdId },
    });

    if (user) {
      // Update name if changed
      if (user.name !== name) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
      }
      return user;
    }

    // Try to find by email (for migration scenarios)
    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Link Azure AD ID to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { azureAdId, name },
      });
      return user;
    }

    // Create new user
    // First user becomes ADMIN, others default to VIEWER
    const userCount = await this.prisma.user.count();
    const role: UserRole = userCount === 0 ? UserRole.ADMIN : UserRole.VIEWER;

    user = await this.prisma.user.create({
      data: {
        email,
        name,
        azureAdId,
        role,
        isActive: true,
      },
    });

    logger.info(`New user created: ${email} with role ${role}`);

    return user;
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(user: User): string {
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      azureAdId: user.azureAdId || undefined,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'dam-backend',
      audience: 'dam-frontend',
    });
  }

  /**
   * Generate JWT refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'dam-backend',
      audience: 'dam-frontend',
    });
  }

  /**
   * Update user's last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        department: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }
}
