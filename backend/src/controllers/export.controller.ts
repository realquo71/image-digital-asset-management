// Export Controller
// Handles export of assets in various formats (ICCD XML, RDF, JSON-LD)

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ICCDExportService } from '../services/iccd-export.service';
import { RDFExportService } from '../services/rdf-export.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class ExportController {
  private iccdService: ICCDExportService;
  private rdfService: RDFExportService;

  constructor() {
    this.iccdService = new ICCDExportService(prisma);
    this.rdfService = new RDFExportService(prisma);
  }

  /**
   * Export single asset to ICCD XML
   * GET /api/v1/export/iccd/:assetId
   */
  exportAssetICCD = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params;
      const { includeArcoTags = 'true', includeTags = 'true' } = req.query;

      const xml = await this.iccdService.exportAssetToICCD(assetId, {
        includeArcoTags: includeArcoTags === 'true',
        includeTags: includeTags === 'true',
      });

      // Set headers for XML download
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="asset-${assetId}-iccd.xml"`);

      res.send(xml);

      logger.info(`ICCD XML export completed for asset: ${assetId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export multiple assets to ICCD XML
   * POST /api/v1/export/iccd
   */
  exportAssetsICCD = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetIds, includeArcoTags = true, includeTags = true } = req.body;

      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        throw new BadRequestError('assetIds array is required');
      }

      const xml = await this.iccdService.exportAssetsToICCD(assetIds, {
        includeArcoTags,
        includeTags,
      });

      // Set headers for XML download
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="assets-${assetIds.length}-iccd.xml"`
      );

      res.send(xml);

      logger.info(`ICCD XML export completed for ${assetIds.length} assets`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export single asset to JSON-LD
   * GET /api/v1/export/jsonld/:assetId
   */
  exportAssetJSONLD = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params;
      const { includeArcoTags = 'true', includeTags = 'true' } = req.query;

      const jsonld = await this.rdfService.exportAssetToJSONLD(assetId, {
        includeArcoTags: includeArcoTags === 'true',
        includeTags: includeTags === 'true',
      });

      res.json({
        success: true,
        data: jsonld,
      });

      logger.info(`JSON-LD export completed for asset: ${assetId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export multiple assets to JSON-LD
   * POST /api/v1/export/jsonld
   */
  exportAssetsJSONLD = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetIds, includeArcoTags = true, includeTags = true } = req.body;

      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        throw new BadRequestError('assetIds array is required');
      }

      const jsonld = await this.rdfService.exportAssetsToJSONLD(assetIds, {
        includeArcoTags,
        includeTags,
      });

      res.json({
        success: true,
        data: jsonld,
      });

      logger.info(`JSON-LD export completed for ${assetIds.length} assets`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export single asset to RDF Turtle
   * GET /api/v1/export/turtle/:assetId
   */
  exportAssetTurtle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params;
      const { includeArcoTags = 'true', includeTags = 'true' } = req.query;

      const turtle = await this.rdfService.exportAssetToTurtle(assetId, {
        includeArcoTags: includeArcoTags === 'true',
        includeTags: includeTags === 'true',
      });

      // Set headers for Turtle download
      res.setHeader('Content-Type', 'text/turtle');
      res.setHeader('Content-Disposition', `attachment; filename="asset-${assetId}.ttl"`);

      res.send(turtle);

      logger.info(`Turtle RDF export completed for asset: ${assetId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export single asset to N-Triples
   * GET /api/v1/export/ntriples/:assetId
   */
  exportAssetNTriples = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params;
      const { includeArcoTags = 'true', includeTags = 'true' } = req.query;

      const ntriples = await this.rdfService.exportAssetToNTriples(assetId, {
        includeArcoTags: includeArcoTags === 'true',
        includeTags: includeTags === 'true',
      });

      // Set headers for N-Triples download
      res.setHeader('Content-Type', 'application/n-triples');
      res.setHeader('Content-Disposition', `attachment; filename="asset-${assetId}.nt"`);

      res.send(ntriples);

      logger.info(`N-Triples export completed for asset: ${assetId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available export formats
   * GET /api/v1/export/formats
   */
  getExportFormats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const formats = [
        {
          id: 'iccd-xml',
          name: 'ICCD XML',
          description: 'Italian Cultural Heritage Catalog Standard (XML)',
          mimeType: 'application/xml',
          fileExtension: '.xml',
          endpoints: {
            single: '/api/v1/export/iccd/:assetId',
            multiple: '/api/v1/export/iccd',
          },
        },
        {
          id: 'json-ld',
          name: 'JSON-LD',
          description: 'JSON for Linked Data',
          mimeType: 'application/ld+json',
          fileExtension: '.jsonld',
          endpoints: {
            single: '/api/v1/export/jsonld/:assetId',
            multiple: '/api/v1/export/jsonld',
          },
        },
        {
          id: 'turtle',
          name: 'RDF Turtle',
          description: 'Terse RDF Triple Language',
          mimeType: 'text/turtle',
          fileExtension: '.ttl',
          endpoints: {
            single: '/api/v1/export/turtle/:assetId',
          },
        },
        {
          id: 'n-triples',
          name: 'N-Triples',
          description: 'N-Triples RDF Format',
          mimeType: 'application/n-triples',
          fileExtension: '.nt',
          endpoints: {
            single: '/api/v1/export/ntriples/:assetId',
          },
        },
      ];

      res.json({
        success: true,
        data: formats,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const exportController = new ExportController();
