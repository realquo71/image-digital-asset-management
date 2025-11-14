// RDF/JSON-LD Export Service
// Exports asset metadata in RDF (Resource Description Framework) and JSON-LD formats
// For Linked Open Data (LOD) interoperability

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface RDFExportOptions {
  format?: 'json-ld' | 'turtle' | 'n-triples';
  includeArcoTags?: boolean;
  includeTags?: boolean;
  baseUri?: string;
}

export class RDFExportService {
  private defaultBaseUri = 'https://dam.culturalheritage.it/resource/';

  constructor(private prisma: PrismaClient) {}

  /**
   * Export single asset to JSON-LD format
   */
  async exportAssetToJSONLD(assetId: string, options: RDFExportOptions = {}): Promise<object> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        creator: true,
        tags: {
          include: {
            tag: true,
          },
        },
        arcoTags: true,
      },
    });

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    return this.generateJSONLD(asset, options);
  }

  /**
   * Export multiple assets to JSON-LD format
   */
  async exportAssetsToJSONLD(
    assetIds: string[],
    options: RDFExportOptions = {}
  ): Promise<object> {
    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
      },
      include: {
        creator: true,
        tags: {
          include: {
            tag: true,
          },
        },
        arcoTags: true,
      },
    });

    return this.generateJSONLDCollection(assets, options);
  }

  /**
   * Export asset to RDF Turtle format
   */
  async exportAssetToTurtle(assetId: string, options: RDFExportOptions = {}): Promise<string> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        creator: true,
        tags: {
          include: {
            tag: true,
          },
        },
        arcoTags: true,
      },
    });

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    return this.generateTurtle(asset, options);
  }

  /**
   * Generate JSON-LD for a single asset
   */
  private generateJSONLD(asset: any, options: RDFExportOptions): object {
    const baseUri = options.baseUri || this.defaultBaseUri;
    const assetUri = `${baseUri}asset/${asset.id}`;

    const jsonld: any = {
      '@context': {
        '@vocab': 'http://schema.org/',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'dcterms': 'http://purl.org/dc/terms/',
        'arco': 'https://w3id.org/arco/ontology/arco/',
        'foaf': 'http://xmlns.com/foaf/0.1/',
      },
      '@id': assetUri,
      '@type': 'CreativeWork',

      // Basic metadata
      'name': asset.title,
      'description': asset.description || undefined,
      'identifier': asset.id,

      // File properties
      'encodingFormat': asset.mimeType,
      'contentSize': asset.fileSize,
      'contentUrl': asset.sharepointUrl,

      // Dates
      'dateCreated': asset.createdAt.toISOString(),
      'dateModified': asset.updatedAt.toISOString(),
      'datePublished': asset.publishedAt?.toISOString(),

      // Creator
      'creator': asset.creator ? {
        '@type': 'Person',
        'name': asset.creator.name,
        'email': asset.creator.email,
      } : undefined,

      // Image properties
      ...(asset.width && asset.height ? {
        'image': {
          '@type': 'ImageObject',
          'width': {
            '@type': 'QuantitativeValue',
            'value': asset.width,
            'unitCode': 'E37', // Pixels
          },
          'height': {
            '@type': 'QuantitativeValue',
            'value': asset.height,
            'unitCode': 'E37', // Pixels
          },
          'contentUrl': asset.sharepointUrl,
          'thumbnailUrl': asset.thumbnailUrl,
        },
      } : {}),

      // Camera/Equipment
      ...(asset.camera ? {
        'exifData': {
          '@type': 'PropertyValue',
          'name': 'camera',
          'value': asset.camera,
        },
      } : {}),

      // Capture date
      ...(asset.captureDate ? {
        'temporal': asset.captureDate.toISOString(),
      } : {}),

      // GPS location
      ...(asset.gpsLatitude && asset.gpsLongitude ? {
        'contentLocation': {
          '@type': 'Place',
          'geo': {
            '@type': 'GeoCoordinates',
            'latitude': asset.gpsLatitude,
            'longitude': asset.gpsLongitude,
          },
        },
      } : {}),
    };

    // Add tags
    if (options.includeTags && asset.tags && asset.tags.length > 0) {
      jsonld['keywords'] = asset.tags.map((tagRelation: any) => tagRelation.tag.name);
    }

    // Add ArCo semantic tags
    if (options.includeArcoTags && asset.arcoTags && asset.arcoTags.length > 0) {
      jsonld['about'] = asset.arcoTags.map((arcoTag: any) => ({
        '@type': 'Thing',
        '@id': arcoTag.arcoUri,
        'name': arcoTag.label,
        'additionalType': arcoTag.category,
        'identifier': arcoTag.notation || undefined,
      }));
    }

    // Remove undefined values
    Object.keys(jsonld).forEach(key => {
      if (jsonld[key] === undefined) {
        delete jsonld[key];
      }
    });

    logger.info(`Generated JSON-LD for asset: ${asset.id}`);

    return jsonld;
  }

  /**
   * Generate JSON-LD for multiple assets
   */
  private generateJSONLDCollection(assets: any[], options: RDFExportOptions): object {
    const baseUri = options.baseUri || this.defaultBaseUri;

    const jsonld = {
      '@context': {
        '@vocab': 'http://schema.org/',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'dcterms': 'http://purl.org/dc/terms/',
        'arco': 'https://w3id.org/arco/ontology/arco/',
      },
      '@type': 'ItemList',
      '@id': `${baseUri}collection/${Date.now()}`,
      'numberOfItems': assets.length,
      'itemListElement': assets.map((asset, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': this.generateJSONLD(asset, options),
      })),
    };

    logger.info(`Generated JSON-LD collection for ${assets.length} assets`);

    return jsonld;
  }

  /**
   * Generate RDF Turtle format for an asset
   */
  private generateTurtle(asset: any, options: RDFExportOptions): string {
    const baseUri = options.baseUri || this.defaultBaseUri;
    const assetUri = `${baseUri}asset/${asset.id}`;

    let turtle = `@prefix schema: <http://schema.org/> .
@prefix dc: <http://purl.org/dc/elements/1.1/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix arco: <https://w3id.org/arco/ontology/arco/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<${assetUri}> a schema:CreativeWork ;
    schema:name "${this.escapeTurtle(asset.title)}" ;
`;

    if (asset.description) {
      turtle += `    schema:description "${this.escapeTurtle(asset.description)}" ;\n`;
    }

    turtle += `    schema:identifier "${asset.id}" ;
    schema:encodingFormat "${asset.mimeType}" ;
    schema:contentSize ${asset.fileSize} ;
    schema:contentUrl <${asset.sharepointUrl}> ;
    schema:dateCreated "${asset.createdAt.toISOString()}"^^xsd:dateTime ;
    schema:dateModified "${asset.updatedAt.toISOString()}"^^xsd:dateTime ;
`;

    if (asset.publishedAt) {
      turtle += `    schema:datePublished "${asset.publishedAt.toISOString()}"^^xsd:dateTime ;\n`;
    }

    // Creator
    if (asset.creator) {
      turtle += `    schema:creator [
        a schema:Person ;
        schema:name "${this.escapeTurtle(asset.creator.name)}" ;
        schema:email "${asset.creator.email}"
    ] ;
`;
    }

    // Image dimensions
    if (asset.width && asset.height) {
      turtle += `    schema:image [
        a schema:ImageObject ;
        schema:width ${asset.width} ;
        schema:height ${asset.height} ;
        schema:contentUrl <${asset.sharepointUrl}>
    ] ;
`;
    }

    // GPS location
    if (asset.gpsLatitude && asset.gpsLongitude) {
      turtle += `    schema:contentLocation [
        a schema:Place ;
        schema:geo [
            a schema:GeoCoordinates ;
            schema:latitude ${asset.gpsLatitude} ;
            schema:longitude ${asset.gpsLongitude}
        ]
    ] ;
`;
    }

    // Tags
    if (options.includeTags && asset.tags && asset.tags.length > 0) {
      const keywords = asset.tags.map((tagRelation: any) =>
        `"${this.escapeTurtle(tagRelation.tag.name)}"`
      ).join(', ');
      turtle += `    schema:keywords ${keywords} ;\n`;
    }

    // ArCo tags
    if (options.includeArcoTags && asset.arcoTags && asset.arcoTags.length > 0) {
      asset.arcoTags.forEach((arcoTag: any, index: number) => {
        const isLast = index === asset.arcoTags.length - 1 &&
                      (!options.includeTags || !asset.tags || asset.tags.length === 0);
        turtle += `    schema:about <${arcoTag.arcoUri}> ${isLast ? '.' : ';'}\n`;
      });
    } else {
      // Remove trailing semicolon and add period
      turtle = turtle.trimEnd();
      if (turtle.endsWith(';')) {
        turtle = turtle.slice(0, -1) + ' .';
      } else {
        turtle += ' .';
      }
    }

    // Add ArCo tag details
    if (options.includeArcoTags && asset.arcoTags && asset.arcoTags.length > 0) {
      turtle += '\n';
      asset.arcoTags.forEach((arcoTag: any) => {
        turtle += `
<${arcoTag.arcoUri}> a schema:Thing ;
    schema:name "${this.escapeTurtle(arcoTag.label)}" ;
    schema:additionalType "${arcoTag.category}" .\n`;
      });
    }

    logger.info(`Generated Turtle RDF for asset: ${asset.id}`);

    return turtle;
  }

  /**
   * Escape special characters for Turtle format
   */
  private escapeTurtle(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * Convert JSON-LD to N-Triples format (simplified)
   */
  async exportAssetToNTriples(assetId: string, options: RDFExportOptions = {}): Promise<string> {
    const jsonld = await this.exportAssetToJSONLD(assetId, options);

    // Simplified N-Triples generation
    // In production, you would use a proper RDF library like rdflib or jsonld.js
    const baseUri = options.baseUri || this.defaultBaseUri;
    const assetUri = `<${baseUri}asset/${assetId}>`;

    let ntriples = '';

    // This is a simplified conversion - in production use a proper JSON-LD to N-Triples converter
    ntriples += `${assetUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/CreativeWork> .\n`;

    logger.info(`Generated N-Triples for asset: ${assetId}`);

    return ntriples;
  }
}
