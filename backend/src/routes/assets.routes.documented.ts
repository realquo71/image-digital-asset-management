/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Get all assets
 *     description: Retrieve a paginated list of assets with optional filtering
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of items per page
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
 *           format: uuid
 *         description: Filter by creator user ID
 *     responses:
 *       200:
 *         description: List of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Upload a new asset
 *     description: Upload a digital asset with metadata and optional tags
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
 *                 description: Asset file (image or PDF)
 *               title:
 *                 type: string
 *                 description: Asset title
 *               description:
 *                 type: string
 *                 description: Asset description
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED]
 *                 default: DRAFT
 *     responses:
 *       201:
 *         description: Asset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *
 * /assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     description: Retrieve detailed information about a specific asset
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
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Update asset metadata
 *     description: Update asset title, description, or status
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
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset not found
 *   delete:
 *     summary: Delete asset
 *     description: Permanently delete an asset (hard delete)
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset not found
 *
 * /assets/{id}/download:
 *   get:
 *     summary: Download original asset
 *     description: Download the original asset file
 *     tags: [Assets, Downloads]
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
 *         description: Asset file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 *
 * /assets/{id}/thumbnail:
 *   get:
 *     summary: Download asset thumbnail
 *     description: Download a thumbnail version of the asset
 *     tags: [Assets, Downloads]
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
 *         description: Thumbnail image
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Asset or thumbnail not found
 *       401:
 *         description: Unauthorized
 *
 * /assets/{id}/tags:
 *   post:
 *     summary: Add tag to asset
 *     description: Add a free-form tag to an asset
 *     tags: [Assets, Tags]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Rinascimento"
 *     responses:
 *       201:
 *         description: Tag added successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset not found
 *
 * /assets/{id}/tags/{tagId}:
 *   delete:
 *     summary: Remove tag from asset
 *     description: Remove a tag from an asset
 *     tags: [Assets, Tags]
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset or tag not found
 *
 * /assets/{id}/arco-tags:
 *   post:
 *     summary: Add ArCo tag to asset
 *     description: Add a semantic ArCo vocabulary tag to an asset
 *     tags: [Assets, ArCo]
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
 *               - arcoUri
 *               - category
 *               - label
 *             properties:
 *               arcoUri:
 *                 type: string
 *                 format: uri
 *                 example: "https://w3id.org/arco/resource/CulturalPropertyType/scultura"
 *               category:
 *                 type: string
 *                 enum: [CULTURAL_PROPERTY_TYPE, MATERIAL, TECHNIQUE, SUBJECT, DATING, CURRENT_LOCATION, CREATION_PLACE, HISTORICAL_PERIOD]
 *               label:
 *                 type: string
 *                 example: "Scultura"
 *               notation:
 *                 type: string
 *                 example: "S"
 *     responses:
 *       201:
 *         description: ArCo tag added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset not found
 *
 * /assets/{id}/arco-tags/{arcoUri}:
 *   delete:
 *     summary: Remove ArCo tag from asset
 *     description: Remove an ArCo semantic tag from an asset
 *     tags: [Assets, ArCo]
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
 *         description: URL-encoded ArCo URI
 *     responses:
 *       200:
 *         description: ArCo tag removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Asset or tag not found
 */

// This file contains only Swagger documentation
// The actual routes are defined in assets.routes.ts
export {};
