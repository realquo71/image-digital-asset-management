// Audit Service
// Handles audit trail logging for compliance and security

import { PrismaClient, AuditLog } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CreateAuditLogDto {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  success?: boolean;
  errorMessage?: string;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  success?: boolean;
  page?: number;
  limit?: number;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create audit log entry
   */
  async log(data: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details || {},
          success: data.success !== undefined ? data.success : true,
          errorMessage: data.errorMessage,
        },
      });

      logger.debug(`Audit log created: ${data.action} on ${data.entityType}`);

      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw - audit logging failures shouldn't break application flow
      throw error;
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: AuditLogFilters): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {};
      if (filters.dateFrom) {
        where.timestamp.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.timestamp.lte = filters.dateTo;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit logs for specific entity
   */
  async getEntityAuditTrail(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    return await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(dateFrom?: Date, dateTo?: Date): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  }> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = dateFrom;
      if (dateTo) where.timestamp.lte = dateTo;
    }

    const [totalLogs, successfulActions, failedActions, actionGroups, userGroups] =
      await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.count({ where: { ...where, success: true } }),
        this.prisma.auditLog.count({ where: { ...where, success: false } }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          _count: true,
          where,
          orderBy: { _count: { action: 'desc' } },
          take: 10,
        }),
        this.prisma.auditLog.groupBy({
          by: ['userId'],
          _count: true,
          where: {
            ...where,
            userId: { not: null },
          },
          orderBy: { _count: { userId: 'desc' } },
          take: 10,
        }),
      ]);

    // Get user details for top users
    const userIds = userGroups.map(g => g.userId).filter(Boolean) as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map(u => [u.id, u.name]));

    return {
      totalLogs,
      successfulActions,
      failedActions,
      actionsByType: actionGroups.map(g => ({
        action: g.action,
        count: g._count,
      })),
      topUsers: userGroups.map(g => ({
        userId: g.userId!,
        userName: userMap.get(g.userId!) || 'Unknown',
        count: g._count,
      })),
    };
  }

  /**
   * Clean up old audit logs (for GDPR compliance)
   * Delete logs older than specified days
   */
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} audit logs older than ${daysToKeep} days`);

    return result.count;
  }

  /**
   * Export audit logs as CSV
   */
  async exportAuditLogs(filters: AuditLogFilters): Promise<string> {
    const { items } = await this.getAuditLogs({
      ...filters,
      limit: 10000, // Max export size
    });

    // CSV header
    let csv = 'Timestamp,Action,Entity Type,Entity ID,User,IP Address,Success,Error\n';

    // CSV rows
    items.forEach(log => {
      const timestamp = log.timestamp.toISOString();
      const action = log.action;
      const entityType = log.entityType;
      const entityId = log.entityId || '';
      const user = (log as any).user?.email || '';
      const ipAddress = log.ipAddress || '';
      const success = log.success ? 'Yes' : 'No';
      const error = log.errorMessage || '';

      csv += `"${timestamp}","${action}","${entityType}","${entityId}","${user}","${ipAddress}","${success}","${error}"\n`;
    });

    return csv;
  }
}
