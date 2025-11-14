// Audit Routes
// Defines routes for audit log viewing (ADMIN only)

import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const auditController = new AuditController();

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Get audit logs with filters
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Audit logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.get('/', authenticate, authorize('ADMIN'), auditController.getAuditLogs);

/**
 * @swagger
 * /audit/entity/{type}/{id}:
 *   get:
 *     summary: Get audit trail for specific entity
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type (e.g., ASSET, COLLECTION)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity audit trail
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.get('/entity/:type/:id', authenticate, authorize('ADMIN'), auditController.getEntityAuditTrail);

/**
 * @swagger
 * /audit/stats:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Audit statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.get('/stats', authenticate, authorize('ADMIN'), auditController.getAuditStatistics);

/**
 * @swagger
 * /audit/export:
 *   get:
 *     summary: Export audit logs as CSV
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.get('/export', authenticate, authorize('ADMIN'), auditController.exportAuditLogs);

export { router as auditRoutes };
