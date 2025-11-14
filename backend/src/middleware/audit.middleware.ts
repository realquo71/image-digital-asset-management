// Audit Middleware
// Automatically logs important HTTP operations for compliance

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

const auditService = new AuditService(getPrismaClient());

/**
 * Audit middleware - logs state-changing operations
 * Only logs POST, PUT, PATCH, DELETE operations
 */
export const auditMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Only audit state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Skip audit for certain paths (like health checks)
  const skipPaths = ['/api/v1/health', '/api/v1/auth/refresh'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Capture original res.json to intercept response
  const originalJson = res.json.bind(res);

  // Track start time
  const startTime = Date.now();

  // Override res.json to capture response
  res.json = function (body: any): Response {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 400;

    // Extract entity information from request
    const { entityType, entityId, action } = extractEntityInfo(req);

    // Create audit log (async, don't block response)
    auditService
      .log({
        action,
        entityType,
        entityId,
        userId: req.user?.id,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          requestBody: sanitizeBody(req.body),
        },
        success,
        errorMessage: success ? undefined : body?.error?.message,
      })
      .catch(error => {
        logger.error('Audit logging failed:', error);
      });

    // Call original json method
    return originalJson(body);
  };

  next();
};

/**
 * Extract entity type and ID from request
 */
function extractEntityInfo(req: Request): {
  entityType: string;
  entityId?: string;
  action: string;
} {
  const pathParts = req.path.split('/').filter(Boolean);

  // Remove 'api/v1' prefix if present
  if (pathParts[0] === 'api' && pathParts[1] === 'v1') {
    pathParts.splice(0, 2);
  }

  const resourceType = pathParts[0] || 'unknown';
  const resourceId = pathParts[1];

  // Determine action
  let action = 'UNKNOWN';

  switch (req.method) {
    case 'POST':
      if (resourceId) {
        // POST /assets/123/tags -> ADD_TAG
        action = `ADD_${pathParts[2]?.toUpperCase() || 'ITEM'}`;
      } else {
        // POST /assets -> CREATE_ASSET
        action = `CREATE_${resourceType.toUpperCase().slice(0, -1)}`;
      }
      break;
    case 'PUT':
    case 'PATCH':
      action = `UPDATE_${resourceType.toUpperCase().slice(0, -1)}`;
      break;
    case 'DELETE':
      if (pathParts[2]) {
        // DELETE /assets/123/tags/456 -> REMOVE_TAG
        action = `REMOVE_${pathParts[2]?.toUpperCase().slice(0, -1) || 'ITEM'}`;
      } else {
        // DELETE /assets/123 -> DELETE_ASSET
        action = `DELETE_${resourceType.toUpperCase().slice(0, -1)}`;
      }
      break;
  }

  return {
    entityType: resourceType.toUpperCase().slice(0, -1),
    entityId: resourceId && resourceId.match(/^[0-9a-f-]{36}$/i) ? resourceId : undefined,
    action,
  };
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    return typeof forwarded === 'string'
      ? forwarded.split(',')[0]
      : forwarded[0];
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Sanitize request body (remove sensitive data)
 */
function sanitizeBody(body: any): any {
  if (!body) return {};

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'newPassword',
    'currentPassword',
    'token',
    'refreshToken',
    'accessToken',
    'secret',
    'apiKey',
  ];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Audit specific action manually
 */
export async function auditAction(
  action: string,
  entityType: string,
  entityId: string | undefined,
  userId: string | undefined,
  details?: any
): Promise<void> {
  try {
    await auditService.log({
      action,
      entityType,
      entityId,
      userId,
      details,
      success: true,
    });
  } catch (error) {
    logger.error('Manual audit logging failed:', error);
  }
}
