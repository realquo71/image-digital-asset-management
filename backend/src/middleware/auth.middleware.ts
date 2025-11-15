// Authentication middleware
// Verifies JWT tokens and attaches user to request

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest, UserPayload } from '../types';
import { UserRole } from '@prisma/client';

/**
 * Authenticate user by verifying JWT token
 */
export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const authHeader = authReq.headers.authorization;

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
    authReq.user = decoded;

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
export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      next(new UnauthorizedError('User not authenticated'));
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
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
export const optionalAuth: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const authHeader = authReq.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
        authReq.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
