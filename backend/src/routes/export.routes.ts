// Export Routes
// API routes for exporting assets in various formats

import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Asset export in various formats (ICCD XML, JSON-LD, RDF)
 */

/**
 * @swagger
 * /export/formats:
 *   get:
 *     summary: Get available export formats
 *     description: Returns a list of supported export formats with endpoints
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of export formats
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
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       mimeType:
 *                         type: string
 *                       fileExtension:
 *                         type: string
 */
router.get('/formats', authenticate, exportController.getExportFormats);

/**
 * @swagger
 * /export/iccd/{assetId}:
 *   get:
 *     summary: Export single asset to ICCD XML
 *     description: Export asset metadata in ICCD (Italian Cultural Heritage) XML format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *       - in: query
 *         name: includeArcoTags
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include ArCo semantic tags
 *       - in: query
 *         name: includeTags
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include free-form tags
 *     responses:
 *       200:
 *         description: ICCD XML file
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 */
router.get('/iccd/:assetId', authenticate, exportController.exportAssetICCD);

/**
 * @swagger
 * /export/iccd:
 *   post:
 *     summary: Export multiple assets to ICCD XML
 *     description: Export multiple assets metadata in ICCD XML format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Array of asset IDs to export
 *               includeArcoTags:
 *                 type: boolean
 *                 default: true
 *               includeTags:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: ICCD XML file with multiple assets
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid request
 */
router.post('/iccd', authenticate, exportController.exportAssetsICCD);

/**
 * @swagger
 * /export/jsonld/{assetId}:
 *   get:
 *     summary: Export single asset to JSON-LD
 *     description: Export asset metadata in JSON-LD (Linked Data) format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *       - in: query
 *         name: includeArcoTags
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeTags
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: JSON-LD representation
 *         content:
 *           application/ld+json:
 *             schema:
 *               type: object
 *       404:
 *         description: Asset not found
 */
router.get('/jsonld/:assetId', authenticate, exportController.exportAssetJSONLD);

/**
 * @swagger
 * /export/jsonld:
 *   post:
 *     summary: Export multiple assets to JSON-LD
 *     description: Export multiple assets in JSON-LD format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
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
 *               includeArcoTags:
 *                 type: boolean
 *                 default: true
 *               includeTags:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: JSON-LD collection
 *         content:
 *           application/ld+json:
 *             schema:
 *               type: object
 */
router.post('/jsonld', authenticate, exportController.exportAssetsJSONLD);

/**
 * @swagger
 * /export/turtle/{assetId}:
 *   get:
 *     summary: Export single asset to RDF Turtle
 *     description: Export asset metadata in Turtle RDF format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeArcoTags
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeTags
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Turtle RDF file
 *         content:
 *           text/turtle:
 *             schema:
 *               type: string
 */
router.get('/turtle/:assetId', authenticate, exportController.exportAssetTurtle);

/**
 * @swagger
 * /export/ntriples/{assetId}:
 *   get:
 *     summary: Export single asset to N-Triples
 *     description: Export asset metadata in N-Triples RDF format
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeArcoTags
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeTags
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: N-Triples file
 *         content:
 *           application/n-triples:
 *             schema:
 *               type: string
 */
router.get('/ntriples/:assetId', authenticate, exportController.exportAssetNTriples);

export default router;
