// ArCo Routes
// Defines routes for ArCo vocabulary endpoints

import { Router } from 'express';
import { ArCoController } from '../controllers/arco.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const arcoController = new ArCoController();

/**
 * @swagger
 * /arco/search:
 *   get:
 *     summary: Search ArCo vocabulary
 *     tags: [ArCo]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CULTURAL_PROPERTY_TYPE, MATERIAL, TECHNIQUE, SUBJECT, DATING, CURRENT_LOCATION, CREATION_PLACE, HISTORICAL_PERIOD]
 *         description: ArCo category to search
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uri:
 *                         type: string
 *                       label:
 *                         type: string
 *                       notation:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *       400:
 *         description: Invalid request parameters
 */
router.get('/search', arcoController.search);

/**
 * @swagger
 * /arco/entity:
 *   get:
 *     summary: Get ArCo entity by URI
 *     tags: [ArCo]
 *     parameters:
 *       - in: query
 *         name: uri
 *         required: true
 *         schema:
 *           type: string
 *         description: ArCo entity URI (URL-encoded)
 *     responses:
 *       200:
 *         description: Entity details
 *       404:
 *         description: Entity not found
 */
router.get('/entity', arcoController.getEntity);

/**
 * @swagger
 * /arco/categories:
 *   get:
 *     summary: List all ArCo categories
 *     tags: [ArCo]
 *     responses:
 *       200:
 *         description: List of available categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       label:
 *                         type: string
 *                       description:
 *                         type: string
 */
router.get('/categories', arcoController.getCategories);

/**
 * @swagger
 * /arco/sync/status:
 *   get:
 *     summary: Get ArCo sync status
 *     tags: [ArCo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status for all categories
 *       401:
 *         description: Unauthorized
 */
router.get('/sync/status', authenticate, authorize('ADMIN', 'CURATOR'), arcoController.getSyncStatus);

/**
 * @swagger
 * /arco/sync/{category}:
 *   post:
 *     summary: Sync ArCo vocabulary for specific category
 *     tags: [ArCo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category to sync
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.post('/sync/:category', authenticate, authorize('ADMIN'), arcoController.syncCategory);

/**
 * @swagger
 * /arco/sync:
 *   post:
 *     summary: Sync all ArCo vocabularies
 *     tags: [ArCo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full sync completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.post('/sync', authenticate, authorize('ADMIN'), arcoController.syncAll);

/**
 * @swagger
 * /arco/cache/{category}:
 *   delete:
 *     summary: Clear cache for specific category
 *     tags: [ArCo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category to clear
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.delete('/cache/:category', authenticate, authorize('ADMIN'), arcoController.clearCache);

/**
 * @swagger
 * /arco/cache:
 *   delete:
 *     summary: Clear all ArCo caches
 *     tags: [ArCo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All caches cleared successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.delete('/cache', authenticate, authorize('ADMIN'), arcoController.clearAllCaches);

export { router as arcoRoutes };
