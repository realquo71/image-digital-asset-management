// ArCo Controller
// Handles ArCo vocabulary HTTP requests

import { Request, Response, NextFunction } from 'express';
import { ArCoCacheService } from '../services/arco/arco-cache.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export class ArCoController {
  private arcoService: ArCoCacheService;

  constructor() {
    this.arcoService = new ArCoCacheService();
  }

  /**
   * GET /arco/search
   * Search ArCo vocabulary by category and term
   */
  search = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { category, q, limit } = req.query;

      if (!category || typeof category !== 'string') {
        throw new BadRequestError('Category parameter is required');
      }

      if (!q || typeof q !== 'string') {
        throw new BadRequestError('Search query parameter (q) is required');
      }

      const searchLimit = limit ? parseInt(limit as string, 10) : 20;

      if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 100) {
        throw new BadRequestError('Limit must be between 1 and 100');
      }

      const results = await this.arcoService.searchEntities(
        category.toUpperCase(),
        q,
        searchLimit
      );

      res.json({
        success: true,
        data: results,
        meta: {
          category,
          query: q,
          count: results.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /arco/entity/:uri
   * Get ArCo entity by URI (URL-encoded)
   */
  getEntity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { uri } = req.query;

      if (!uri || typeof uri !== 'string') {
        throw new BadRequestError('URI parameter is required');
      }

      const entity = await this.arcoService.getEntityByUri(uri);

      if (!entity) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Entity with URI '${uri}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: entity,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /arco/categories
   * List all available ArCo categories
   */
  getCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const categories = [
        {
          code: 'CULTURAL_PROPERTY_TYPE',
          label: 'Tipo di Bene Culturale',
          description: 'Cultural property types and classifications',
        },
        {
          code: 'MATERIAL',
          label: 'Materiale',
          description: 'Materials used in the cultural property',
        },
        {
          code: 'TECHNIQUE',
          label: 'Tecnica',
          description: 'Techniques and methods used in creation',
        },
        {
          code: 'SUBJECT',
          label: 'Soggetto',
          description: 'Subjects and themes depicted',
        },
        {
          code: 'DATING',
          label: 'Datazione',
          description: 'Dating and chronological information',
        },
        {
          code: 'CURRENT_LOCATION',
          label: 'Ubicazione Attuale',
          description: 'Current location of the cultural property',
        },
        {
          code: 'CREATION_PLACE',
          label: 'Luogo di Creazione',
          description: 'Place where the property was created',
        },
        {
          code: 'HISTORICAL_PERIOD',
          label: 'Periodo Storico',
          description: 'Historical period or era',
        },
      ];

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /arco/sync/status
   * Get sync status for all categories
   */
  getSyncStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const status = await this.arcoService.getSyncStatus();

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /arco/sync/:category
   * Trigger sync for a specific category (ADMIN only)
   */
  syncCategory = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { category } = req.params;

      if (!category) {
        throw new BadRequestError('Category parameter is required');
      }

      logger.info(`Starting manual ArCo sync for category: ${category}`, {
        userId: req.user?.id,
      });

      const count = await this.arcoService.syncCategory(category.toUpperCase());

      res.json({
        success: true,
        message: `Successfully synced ${count} entities for category ${category}`,
        data: {
          category,
          entityCount: count,
          syncedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /arco/sync
   * Trigger full sync for all categories (ADMIN only)
   */
  syncAll = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info(`Starting manual full ArCo sync`, {
        userId: req.user?.id,
      });

      const results = await this.arcoService.syncAllCategories();

      const totalCount = Object.values(results).reduce((sum, count) => sum + count, 0);

      res.json({
        success: true,
        message: `Successfully synced ${totalCount} entities across all categories`,
        data: {
          results,
          totalCount,
          syncedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /arco/cache/:category
   * Clear cache for a specific category (ADMIN only)
   */
  clearCache = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { category } = req.params;

      if (!category) {
        throw new BadRequestError('Category parameter is required');
      }

      logger.info(`Clearing ArCo cache for category: ${category}`, {
        userId: req.user?.id,
      });

      await this.arcoService.clearCategory(category.toUpperCase());

      res.json({
        success: true,
        message: `Cache cleared for category ${category}`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /arco/cache
   * Clear all ArCo caches (ADMIN only)
   */
  clearAllCaches = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info(`Clearing all ArCo caches`, {
        userId: req.user?.id,
      });

      await this.arcoService.clearAll();

      res.json({
        success: true,
        message: 'All ArCo caches cleared',
      });
    } catch (error) {
      next(error);
    }
  };
}
