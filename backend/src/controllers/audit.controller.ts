// Audit Controller
// Handles audit log viewing and export (ADMIN only)

import { Request, Response, NextFunction } from 'express';
import { AuditService, AuditLogFilters } from '../services/audit.service';
import { AuthenticatedRequest } from '../types';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService(getPrismaClient());
  }

  /**
   * GET /audit
   * Get audit logs with filters
   */
  getAuditLogs = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: AuditLogFilters = {
        userId: req.query.userId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        success: req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await this.auditService.getAuditLogs(filters);

      res.json({
        success: true,
        data: result.items,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /audit/entity/:type/:id
   * Get audit trail for specific entity
   */
  getEntityAuditTrail = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { type, id } = req.params;

      const auditTrail = await this.auditService.getEntityAuditTrail(type, id);

      res.json({
        success: true,
        data: auditTrail,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /audit/stats
   * Get audit statistics
   */
  getAuditStatistics = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const stats = await this.auditService.getAuditStatistics(dateFrom, dateTo);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /audit/export
   * Export audit logs as CSV
   */
  exportAuditLogs = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: AuditLogFilters = {
        userId: req.query.userId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        success: req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined,
      };

      const csv = await this.auditService.exportAuditLogs(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);

      logger.info(`Audit logs exported by ${req.user?.email}`);
    } catch (error) {
      next(error);
    }
  };
}
