// Asset Routes
// Defines routes for asset endpoints

import { Router } from 'express';
import multer from 'multer';
import { AssetController } from '../controllers/asset.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { config } from '../config';

const router = Router();
const assetController = new AssetController();

// Configure Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Upload new asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED]
 *     responses:
 *       201:
 *         description: Asset uploaded successfully
 *       400:
 *         description: Invalid request or file
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'CURATOR'),
  upload.single('file'),
  assetController.upload
);

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: List assets with filters
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, fileSize]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of assets
 */
router.get('/', optionalAuth, assetController.list);

/**
 * @swagger
 * /assets/stats:
 *   get:
 *     summary: Get asset statistics
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset statistics
 */
router.get('/stats', authenticate, authorize('ADMIN', 'CURATOR'), assetController.getStatistics);

/**
 * @swagger
 * /assets/bulk-download:
 *   post:
 *     summary: Download multiple assets as ZIP archive
 *     tags: [Assets]
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
 *                 description: Array of asset IDs to download
 *                 maxItems: 100
 *               includeMetadata:
 *                 type: boolean
 *                 default: false
 *                 description: Include metadata.json file in ZIP
 *     responses:
 *       200:
 *         description: ZIP file download
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request
 */
router.post('/bulk-download', assetController.bulkDownload);

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Assets]
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
 *         description: Asset details
 *       404:
 *         description: Asset not found
 */
router.get('/:id', optionalAuth, assetController.getById);

/**
 * @swagger
 * /assets/{id}:
 *   patch:
 *     summary: Update asset metadata
 *     tags: [Assets]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset not found
 */
router.patch('/:id', authenticate, authorize('ADMIN', 'CURATOR'), assetController.update);

/**
 * @swagger
 * /assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     tags: [Assets]
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
 *         description: Asset deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset not found
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'CURATOR'), assetController.delete);

/**
 * @swagger
 * /assets/{id}/download:
 *   get:
 *     summary: Download original asset file
 *     tags: [Assets]
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
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Asset not found
 */
router.get('/:id/download', optionalAuth, assetController.download);

/**
 * @swagger
 * /assets/{id}/thumbnail:
 *   get:
 *     summary: Download asset thumbnail
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thumbnail downloaded successfully
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Thumbnail not found
 */
router.get('/:id/thumbnail', assetController.downloadThumbnail);

/**
 * @swagger
 * /assets/{id}/tags:
 *   post:
 *     summary: Add tags to asset
 *     tags: [Assets]
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tags added successfully
 *       404:
 *         description: Asset not found
 */
router.post('/:id/tags', authenticate, authorize('ADMIN', 'CURATOR'), assetController.addTags);

/**
 * @swagger
 * /assets/{id}/tags/{tagId}:
 *   delete:
 *     summary: Remove tag from asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tag removed successfully
 *       404:
 *         description: Asset or tag not found
 */
router.delete(
  '/:id/tags/:tagId',
  authenticate,
  authorize('ADMIN', 'CURATOR'),
  assetController.removeTag
);

/**
 * @swagger
 * /assets/{id}/arco-tags:
 *   post:
 *     summary: Add ArCo tags to asset
 *     tags: [Assets]
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
 *               - arcoTags
 *             properties:
 *               arcoTags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - uri
 *                     - label
 *                     - category
 *                   properties:
 *                     uri:
 *                       type: string
 *                       description: ArCo entity URI
 *                     label:
 *                       type: string
 *                       description: Entity label
 *                     category:
 *                       type: string
 *                       description: ArCo category
 *                     notation:
 *                       type: string
 *                       description: Optional notation code
 *     responses:
 *       200:
 *         description: ArCo tags added successfully
 *       404:
 *         description: Asset not found
 */
router.post(
  '/:id/arco-tags',
  authenticate,
  authorize('ADMIN', 'CURATOR'),
  assetController.addArCoTags
);

/**
 * @swagger
 * /assets/{id}/arco-tags/{arcoUri}:
 *   delete:
 *     summary: Remove ArCo tag from asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: arcoUri
 *         required: true
 *         schema:
 *           type: string
 *         description: ArCo URI (URL-encoded)
 *     responses:
 *       200:
 *         description: ArCo tag removed successfully
 *       404:
 *         description: Asset not found
 */
router.delete(
  '/:id/arco-tags/:arcoUri',
  authenticate,
  authorize('ADMIN', 'CURATOR'),
  assetController.removeArCoTag
);

export { router as assetRoutes };
