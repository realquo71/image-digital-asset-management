// Authentication Controller
// Handles authentication-related HTTP requests

import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AzureAuthCallbackDto, RefreshTokenDto } from '../dto/auth.dto';
import { AuthenticatedRequest } from '../types';
import { getPrismaClient } from '../config/database';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService(getPrismaClient());
  }

  /**
   * GET /auth/azure/url
   * Get Azure AD authorization URL
   */
  getAzureAuthUrl = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const redirectUri = (req.query.redirectUri as string) || req.body.redirectUri;

      if (!redirectUri) {
        throw new UnauthorizedError('redirectUri is required');
      }

      const authUrl = this.authService.getAuthorizationUrl(redirectUri);

      res.json({
        success: true,
        data: {
          authUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/azure/callback
   * Handle Azure AD callback with authorization code
   */
  handleAzureCallback = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = AzureAuthCallbackDto.validate(req.body);

      const authResponse = await this.authService.handleAzureCallback(
        dto.code,
        dto.redirectUri
      );

      logger.info(`User logged in: ${authResponse.user.email}`);

      res.json({
        success: true,
        data: authResponse,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  refreshToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = RefreshTokenDto.validate(req.body);

      const authResponse = await this.authService.refreshAccessToken(dto.refreshToken);

      res.json({
        success: true,
        data: authResponse,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /auth/me
   * Get current user information
   */
  getCurrentUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const user = await this.authService.getCurrentUser(req.user.id);

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/logout
   * Logout user (client-side token removal)
   */
  logout = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.user) {
        logger.info(`User logged out: ${req.user.email}`);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
