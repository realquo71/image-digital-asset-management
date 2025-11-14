// Elasticsearch configuration
// Provides Elasticsearch client instance

import { Client } from '@elastic/elasticsearch';
import { config } from './index';
import { logger } from '../utils/logger';

let esClient: Client;

export const getElasticsearchClient = (): Client => {
  if (!esClient) {
    esClient = new Client({
      node: config.elasticsearch.node,
      auth: config.elasticsearch.username && config.elasticsearch.password
        ? {
            username: config.elasticsearch.username,
            password: config.elasticsearch.password,
          }
        : undefined,
      maxRetries: 3,
      requestTimeout: 30000,
      sniffOnStart: false,
    });

    logger.info('✅ Elasticsearch client initialized');
  }

  return esClient;
};

export const connectElasticsearch = async (): Promise<void> => {
  try {
    const client = getElasticsearchClient();
    const health = await client.cluster.health();

    logger.info('✅ Elasticsearch connection successful', {
      clusterName: health.cluster_name,
      status: health.status,
      numberOfNodes: health.number_of_nodes,
    });
  } catch (error) {
    logger.error('❌ Elasticsearch connection failed:', error);
    throw error;
  }
};

export const disconnectElasticsearch = async (): Promise<void> => {
  try {
    if (esClient) {
      await esClient.close();
      logger.info('👋 Elasticsearch disconnected');
    }
  } catch (error) {
    logger.error('❌ Error disconnecting from Elasticsearch:', error);
  }
};

export { esClient };
