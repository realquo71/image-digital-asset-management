// Collection Routes
// Defines routes for collection endpoints

import { Router } from 'express';
import { CollectionController } from '../controllers/collection.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();
const collectionController = new CollectionController();

/**
 * @swagger
 * /collections:
 *   post:
 *     summary: Create new collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Collection created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, collectionController.create);

/**
 * @swagger
 * /collections:
 *   get:
 *     summary: List collections with filters
 *     tags: [Collections]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublic
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
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of collections
 */
router.get('/', optionalAuth, collectionController.list);

/**
 * @swagger
 * /collections/me:
 *   get:
 *     summary: Get current user's collections
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's collections
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, collectionController.getMy);

/**
 * @swagger
 * /collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Collection details
 *       404:
 *         description: Collection not found
 */
router.get('/:id', optionalAuth, collectionController.getById);

/**
 * @swagger
 * /collections/{id}:
 *   patch:
 *     summary: Update collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Collection not found
 */
router.patch('/:id', authenticate, collectionController.update);

/**
 * @swagger
 * /collections/{id}:
 *   delete:
 *     summary: Delete collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Collection deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Collection not found
 */
router.delete('/:id', authenticate, collectionController.delete);

/**
 * @swagger
 * /collections/{id}/assets:
 *   post:
 *     summary: Add assets to collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetIds
 *             properties:
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Assets added successfully
 *       404:
 *         description: Collection or assets not found
 */
router.post('/:id/assets', authenticate, collectionController.addAssets);

/**
 * @swagger
 * /collections/{id}/assets:
 *   delete:
 *     summary: Remove assets from collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetIds
 *             properties:
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Assets removed successfully
 *       404:
 *         description: Collection not found
 */
router.delete('/:id/assets', authenticate, collectionController.removeAssets);

/**
 * @swagger
 * /collections/{id}/duplicate:
 *   post:
 *     summary: Duplicate collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New collection name
 *     responses:
 *       201:
 *         description: Collection duplicated successfully
 *       404:
 *         description: Collection not found
 */
router.post('/:id/duplicate', authenticate, collectionController.duplicate);

/**
 * @swagger
 * /collections/{id}/share:
 *   post:
 *     summary: Make collection public
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Collection shared successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Collection not found
 */
router.post('/:id/share', authenticate, collectionController.share);

/**
 * @swagger
 * /collections/{id}/unshare:
 *   post:
 *     summary: Make collection private
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Collection unshared successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Collection not found
 */
router.post('/:id/unshare', authenticate, collectionController.unshare);

/**
 * @swagger
 * /collections/{id}/download:
 *   get:
 *     summary: Download collection as ZIP archive
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: ZIP file download with all collection assets
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Collection not found
 *       403:
 *         description: Access denied
 */
router.get('/:id/download', collectionController.downloadCollection);

export { router as collectionRoutes };
