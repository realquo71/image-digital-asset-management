// Search Controller
// Handles search HTTP requests

import { Request, Response, NextFunction } from 'express';
import { SearchService, SearchFilters } from '../services/search.service';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  /**
   * GET /search
   * Search assets with filters
   */
  search = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        q,
        status,
        creatorId,
        tags,
        arcoCategories,
        arcoUris,
        dateFrom,
        dateTo,
        mimeTypes,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const filters: SearchFilters = {
        query: q as string,
        status: status as string,
        creatorId: creatorId as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        arcoCategories: arcoCategories
          ? (Array.isArray(arcoCategories) ? arcoCategories as string[] : [arcoCategories as string])
          : undefined,
        arcoUris: arcoUris
          ? (Array.isArray(arcoUris) ? arcoUris as string[] : [arcoUris as string])
          : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        mimeTypes: mimeTypes
          ? (Array.isArray(mimeTypes) ? mimeTypes as string[] : [mimeTypes as string])
          : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        sortBy: (sortBy as string) || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      };

      const results = await this.searchService.searchAssets(filters);

      res.json({
        success: true,
        data: results.items,
        meta: {
          page: results.page,
          limit: results.limit,
          total: results.total,
          pages: results.pages,
        },
        aggregations: results.aggregations,
      });

      logger.debug('Search executed', {
        query: q,
        total: results.total,
        page: results.page,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /search/suggestions
   * Get autocomplete suggestions
   */
  getSuggestions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { field, prefix, limit } = req.query;

      if (!field || !prefix) {
        throw new BadRequestError('Field and prefix parameters are required');
      }

      const allowedFields = ['title', 'tags', 'creatorName'];
      if (!allowedFields.includes(field as string)) {
        throw new BadRequestError(`Field must be one of: ${allowedFields.join(', ')}`);
      }

      const suggestions = await this.searchService.getSuggestions(
        field as string,
        prefix as string,
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /search/reindex
   * Trigger full reindex (ADMIN only)
   */
  reindex = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info('Search reindex triggered by', {
        userId: req.user?.id,
        email: req.user?.email,
      });

      // This would fetch all assets from the database and reindex
      // For now, return a message - actual implementation would need AssetRepository
      res.json({
        success: true,
        message: 'Reindex operation started',
      });
    } catch (error) {
      next(error);
    }
  };
}
