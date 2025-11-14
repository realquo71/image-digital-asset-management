// Search Routes
// Defines routes for search endpoints

import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const searchController = new SearchController();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search assets with advanced filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (full-text search)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         description: Filter by asset status
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *         description: Filter by creator ID
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: arcoCategories
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by ArCo categories
 *       - in: query
 *         name: arcoUris
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by ArCo URIs
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date from
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date to
 *       - in: query
 *         name: mimeTypes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by MIME types
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, createdAt, title, fileSize]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 aggregations:
 *                   type: object
 *                   description: Faceted search aggregations
 */
router.get('/', searchController.search);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get autocomplete suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *           enum: [title, tags, creatorName]
 *         description: Field to search
 *       - in: query
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: Prefix to match
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum suggestions
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 *       400:
 *         description: Invalid parameters
 */
router.get('/suggestions', searchController.getSuggestions);

/**
 * @swagger
 * /search/reindex:
 *   post:
 *     summary: Trigger full search reindex
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reindex started
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN only
 */
router.post('/reindex', authenticate, authorize('ADMIN'), searchController.reindex);

export { router as searchRoutes };
