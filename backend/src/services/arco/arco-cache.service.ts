// ArCo Cache Service
// Manages Redis caching for ArCo vocabulary entities

import Redis from 'ioredis';
import { getRedisClient } from '../../config/redis';
import { ArCoSparqlService, ArCoEntity } from './arco-sparql.service';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class ArCoCacheService {
  private redis: Redis;
  private sparqlService: ArCoSparqlService;
  private cacheTTL: number;

  // ArCo categories
  private readonly CATEGORIES = [
    'CULTURAL_PROPERTY_TYPE',
    'MATERIAL',
    'TECHNIQUE',
    'SUBJECT',
    'DATING',
    'CURRENT_LOCATION',
    'CREATION_PLACE',
    'HISTORICAL_PERIOD',
  ];

  constructor() {
    this.redis = getRedisClient();
    this.sparqlService = new ArCoSparqlService();
    this.cacheTTL = config.arco.cacheTTL; // Default: 7 days
  }

  /**
   * Get cache key for category
   */
  private getCategoryKey(category: string): string {
    return `arco:category:${category}`;
  }

  /**
   * Get cache key for search results
   */
  private getSearchKey(category: string, searchTerm: string): string {
    return `arco:search:${category}:${searchTerm.toLowerCase()}`;
  }

  /**
   * Get cache key for entity URI
   */
  private getEntityKey(uri: string): string {
    return `arco:entity:${uri}`;
  }

  /**
   * Get cache key for last sync timestamp
   */
  private getLastSyncKey(category: string): string {
    return `arco:lastsync:${category}`;
  }

  /**
   * Search entities in cache first, fallback to SPARQL
   */
  async searchEntities(
    category: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<ArCoEntity[]> {
    // Try cache first
    const cacheKey = this.getSearchKey(category, searchTerm);

    try {
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        logger.debug(`ArCo search cache hit: ${cacheKey}`);
        return JSON.parse(cached) as ArCoEntity[];
      }
    } catch (error) {
      logger.warn('Redis get error, falling back to SPARQL:', error);
    }

    // Cache miss - query SPARQL
    logger.debug(`ArCo search cache miss: ${cacheKey}`);
    const results = await this.queryByCategory(category, searchTerm, limit);

    // Cache the results
    try {
      await this.redis.setex(
        cacheKey,
        this.cacheTTL,
        JSON.stringify(results)
      );
    } catch (error) {
      logger.warn('Redis set error:', error);
    }

    return results;
  }

  /**
   * Get entity by URI (cached)
   */
  async getEntityByUri(uri: string): Promise<ArCoEntity | null> {
    const cacheKey = this.getEntityKey(uri);

    // Try cache first
    try {
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        logger.debug(`ArCo entity cache hit: ${uri}`);
        return JSON.parse(cached) as ArCoEntity;
      }
    } catch (error) {
      logger.warn('Redis get error, falling back to SPARQL:', error);
    }

    // Cache miss - query SPARQL
    logger.debug(`ArCo entity cache miss: ${uri}`);
    const entity = await this.sparqlService.getEntityByUri(uri);

    if (entity) {
      // Cache the entity
      try {
        await this.redis.setex(
          cacheKey,
          this.cacheTTL,
          JSON.stringify(entity)
        );
      } catch (error) {
        logger.warn('Redis set error:', error);
      }
    }

    return entity;
  }

  /**
   * Query SPARQL by category
   */
  private async queryByCategory(
    category: string,
    searchTerm: string,
    limit: number
  ): Promise<ArCoEntity[]> {
    switch (category) {
      case 'CULTURAL_PROPERTY_TYPE':
        return await this.sparqlService.searchCulturalPropertyTypes(searchTerm, limit);
      case 'MATERIAL':
        return await this.sparqlService.searchMaterials(searchTerm, limit);
      case 'TECHNIQUE':
        return await this.sparqlService.searchTechniques(searchTerm, limit);
      case 'SUBJECT':
        return await this.sparqlService.searchSubjects(searchTerm, limit);
      case 'CURRENT_LOCATION':
      case 'CREATION_PLACE':
        return await this.sparqlService.searchLocations(searchTerm, limit);
      case 'HISTORICAL_PERIOD':
        return await this.sparqlService.searchHistoricalPeriods(searchTerm, limit);
      case 'DATING':
        // Dating is typically handled differently - for now return empty
        return [];
      default:
        throw new Error(`Unknown ArCo category: ${category}`);
    }
  }

  /**
   * Sync category vocabulary to cache
   */
  async syncCategory(category: string): Promise<number> {
    logger.info(`Starting ArCo vocabulary sync for category: ${category}`);

    try {
      const entities = await this.sparqlService.getAllEntitiesForCategory(category, 1000);

      logger.info(`Fetched ${entities.length} entities for ${category}`);

      // Store each entity in cache
      const pipeline = this.redis.multi();

      for (const entity of entities) {
        const entityKey = this.getEntityKey(entity.uri);
        pipeline.setex(entityKey, this.cacheTTL, JSON.stringify(entity));
      }

      // Store category index
      const categoryKey = this.getCategoryKey(category);
      const entityUris = entities.map(e => e.uri);
      pipeline.setex(categoryKey, this.cacheTTL, JSON.stringify(entityUris));

      // Update last sync timestamp
      const lastSyncKey = this.getLastSyncKey(category);
      pipeline.set(lastSyncKey, new Date().toISOString());

      await pipeline.exec();

      logger.info(`ArCo vocabulary sync completed for ${category}: ${entities.length} entities cached`);

      return entities.length;
    } catch (error) {
      logger.error(`ArCo vocabulary sync failed for ${category}:`, error);
      throw error;
    }
  }

  /**
   * Sync all categories
   */
  async syncAllCategories(): Promise<Record<string, number>> {
    logger.info('Starting full ArCo vocabulary sync for all categories');

    const results: Record<string, number> = {};

    for (const category of this.CATEGORIES) {
      try {
        const count = await this.syncCategory(category);
        results[category] = count;
      } catch (error) {
        logger.error(`Failed to sync category ${category}:`, error);
        results[category] = 0;
      }
    }

    logger.info('Full ArCo vocabulary sync completed:', results);

    return results;
  }

  /**
   * Get last sync timestamp for category
   */
  async getLastSyncTime(category: string): Promise<Date | null> {
    try {
      const lastSyncKey = this.getLastSyncKey(category);
      const timestamp = await this.redis.get(lastSyncKey);

      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      logger.warn('Failed to get last sync time:', error);
      return null;
    }
  }

  /**
   * Get sync status for all categories
   */
  async getSyncStatus(): Promise<
    Array<{
      category: string;
      lastSync: Date | null;
      entityCount: number;
    }>
  > {
    const status = [];

    for (const category of this.CATEGORIES) {
      const lastSync = await this.getLastSyncTime(category);

      // Get entity count from category index
      let entityCount = 0;
      try {
        const categoryKey = this.getCategoryKey(category);
        const entityUris = await this.redis.get(categoryKey);
        if (entityUris) {
          entityCount = JSON.parse(entityUris).length;
        }
      } catch (error) {
        logger.warn(`Failed to get entity count for ${category}:`, error);
      }

      status.push({
        category,
        lastSync,
        entityCount,
      });
    }

    return status;
  }

  /**
   * Clear cache for category
   */
  async clearCategory(category: string): Promise<void> {
    logger.info(`Clearing ArCo cache for category: ${category}`);

    try {
      // Get all entity URIs for this category
      const categoryKey = this.getCategoryKey(category);
      const entityUris = await this.redis.get(categoryKey);

      if (entityUris) {
        const uris = JSON.parse(entityUris) as string[];

        // Delete all entities
        const pipeline = this.redis.multi();

        for (const uri of uris) {
          const entityKey = this.getEntityKey(uri);
          pipeline.del(entityKey);
        }

        // Delete category index
        pipeline.del(categoryKey);

        // Delete last sync timestamp
        const lastSyncKey = this.getLastSyncKey(category);
        pipeline.del(lastSyncKey);

        await pipeline.exec();

        logger.info(`Cleared ${uris.length} entities for category ${category}`);
      }

      // Clear all search result caches for this category
      const searchPattern = `arco:search:${category}:*`;
      const searchKeys = await this.redis.keys(searchPattern);

      if (searchKeys.length > 0) {
        await this.redis.del(searchKeys);
        logger.info(`Cleared ${searchKeys.length} search caches for category ${category}`);
      }
    } catch (error) {
      logger.error(`Failed to clear cache for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Clear all ArCo caches
   */
  async clearAll(): Promise<void> {
    logger.info('Clearing all ArCo caches');

    for (const category of this.CATEGORIES) {
      await this.clearCategory(category);
    }

    logger.info('All ArCo caches cleared');
  }

  /**
   * Check if category needs sync (older than 7 days)
   */
  async needsSync(category: string): Promise<boolean> {
    const lastSync = await this.getLastSyncTime(category);

    if (!lastSync) {
      return true; // Never synced
    }

    const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceSync >= 7; // Sync if older than 7 days
  }

  /**
   * Get categories that need sync
   */
  async getCategoriesNeedingSync(): Promise<string[]> {
    const needSync = [];

    for (const category of this.CATEGORIES) {
      if (await this.needsSync(category)) {
        needSync.push(category);
      }
    }

    return needSync;
  }
}
