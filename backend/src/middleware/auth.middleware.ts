// Authentication middleware
// Verifies JWT tokens and attaches user to request

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest, UserPayload } from '../types';
import { UserRole } from '@prisma/client';

/**
 * Authenticate user by verifying JWT token
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = parts[1];

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Authorize user by checking roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      next(new UnauthorizedError('User not authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        )
      );
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
