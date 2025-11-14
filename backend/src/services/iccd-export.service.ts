// ICCD XML Export Service
// Exports asset metadata in ICCD (Istituto Centrale per il Catalogo e la Documentazione) XML format
// Compliant with Italian Ministry of Culture standards

import { PrismaClient, Asset } from '@prisma/client';
import { create } from 'xmlbuilder2';
import { logger } from '../utils/logger';

export interface ICCDExportOptions {
  includeArcoTags?: boolean;
  includeTags?: boolean;
  schemaVersion?: string;
}

export class ICCDExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Export single asset to ICCD XML format
   */
  async exportAssetToICCD(assetId: string, options: ICCDExportOptions = {}): Promise<string> {
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

    return this.generateICCDXML(asset, options);
  }

  /**
   * Export multiple assets to ICCD XML format
   */
  async exportAssetsToICCD(
    assetIds: string[],
    options: ICCDExportOptions = {}
  ): Promise<string> {
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

    return this.generateICCDXMLCollection(assets, options);
  }

  /**
   * Generate ICCD XML for a single asset
   */
  private generateICCDXML(asset: any, options: ICCDExportOptions): string {
    const schemaVersion = options.schemaVersion || '4.00';

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('scheda', {
        xmlns: 'http://www.iccd.beniculturali.it/ns',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        version: schemaVersion,
      });

    // Metadata section
    const metadata = root.ele('metadata');
    metadata.ele('schemaName').txt('F'); // F = Fotografia (Photography)
    metadata.ele('schemaVersion').txt(schemaVersion);

    // Card section
    const card = root.ele('card');

    // Section CD - Codice Identificativo (Identification Code)
    const cd = card.ele('CD');
    cd.ele('TSK').txt('F'); // Tipo Scheda: F = Fotografia
    cd.ele('LIR').txt(asset.id); // Livello di ricerca
    cd.ele('NCT').ele('NCTR').txt(asset.id); // Numero Catalogo Generale

    // Section OG - Oggetto (Object)
    const og = card.ele('OG');
    og.ele('OGT').ele('OGTD').txt(asset.title); // Oggetto - Definizione
    if (asset.description) {
      og.ele('OGT').ele('OGTT').txt(asset.description); // Oggetto - Tipo
    }

    // Section DA - Dati Analitici (Analytical Data)
    const da = card.ele('DA');

    // DESO - Subject description (from tags)
    if (options.includeTags && asset.tags && asset.tags.length > 0) {
      const deso = da.ele('DESO');
      asset.tags.forEach((tagRelation: any) => {
        deso.ele('DESS').txt(tagRelation.tag.name);
      });
    }

    // ArCo semantic tags
    if (options.includeArcoTags && asset.arcoTags && asset.arcoTags.length > 0) {
      const arc = da.ele('ARC'); // ArCo section
      asset.arcoTags.forEach((arcoTag: any) => {
        const tag = arc.ele('TAG');
        tag.ele('URI').txt(arcoTag.arcoUri);
        tag.ele('LABEL').txt(arcoTag.label);
        tag.ele('CATEGORY').txt(arcoTag.category);
        if (arcoTag.notation) {
          tag.ele('NOTATION').txt(arcoTag.notation);
        }
      });
    }

    // Section TU - Dati Tecnici (Technical Data)
    const tu = card.ele('TU');

    // File information
    const dtt = tu.ele('DTT');
    dtt.ele('DTTN').txt(asset.filename); // Filename
    dtt.ele('DTTM').txt(asset.mimeType); // MIME type
    dtt.ele('DTTS').txt(String(asset.fileSize)); // File size

    // Image dimensions
    if (asset.width && asset.height) {
      const dim = tu.ele('DIM');
      dim.ele('DIMW').txt(String(asset.width)); // Width
      dim.ele('DIMH').txt(String(asset.height)); // Height
    }

    // Camera/Equipment
    if (asset.camera) {
      tu.ele('STRU').ele('STRM').txt(asset.camera);
    }

    // Section RS - Rapporti con altro materiale (Relations)
    const rs = card.ele('RS');
    rs.ele('RSL').txt(asset.sharepointUrl); // Location/URL

    // Section CM - Compilazione (Compilation)
    const cm = card.ele('CM');
    if (asset.creator) {
      cm.ele('CMP').ele('CMPN').txt(asset.creator.name); // Compiler name
      cm.ele('CMP').ele('CMPE').txt(asset.creator.email); // Compiler email
    }
    if (asset.createdAt) {
      cm.ele('CMR').ele('CMPD').txt(asset.createdAt.toISOString().split('T')[0]); // Date
    }

    // Section AN - Annotazioni (Annotations)
    if (asset.captureDate) {
      const an = card.ele('AN');
      an.ele('ANT').txt(`Capture date: ${asset.captureDate.toISOString().split('T')[0]}`);
    }

    if (asset.gpsLatitude && asset.gpsLongitude) {
      const an = card.ele('AN');
      an.ele('GEO')
        .ele('LAT').txt(String(asset.gpsLatitude)).up()
        .ele('LON').txt(String(asset.gpsLongitude));
    }

    const xml = root.end({ prettyPrint: true });

    logger.info(`Generated ICCD XML for asset: ${asset.id}`);

    return xml;
  }

  /**
   * Generate ICCD XML for multiple assets (collection)
   */
  private generateICCDXMLCollection(assets: any[], options: ICCDExportOptions): string {
    const schemaVersion = options.schemaVersion || '4.00';

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('collection', {
        xmlns: 'http://www.iccd.beniculturali.it/ns',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        version: schemaVersion,
      });

    root.ele('metadata')
      .ele('exportDate').txt(new Date().toISOString()).up()
      .ele('recordCount').txt(String(assets.length));

    const records = root.ele('records');

    assets.forEach((asset) => {
      // Generate individual record XML (simplified - without root declaration)
      const record = records.ele('scheda');

      // CD - Identification
      const cd = record.ele('CD');
      cd.ele('TSK').txt('F');
      cd.ele('LIR').txt(asset.id);
      cd.ele('NCT').ele('NCTR').txt(asset.id);

      // OG - Object
      const og = record.ele('OG');
      og.ele('OGT').ele('OGTD').txt(asset.title);
      if (asset.description) {
        og.ele('OGT').ele('OGTT').txt(asset.description);
      }

      // DA - Analytical Data
      const da = record.ele('DA');

      if (options.includeTags && asset.tags && asset.tags.length > 0) {
        const deso = da.ele('DESO');
        asset.tags.forEach((tagRelation: any) => {
          deso.ele('DESS').txt(tagRelation.tag.name);
        });
      }

      if (options.includeArcoTags && asset.arcoTags && asset.arcoTags.length > 0) {
        const arc = da.ele('ARC');
        asset.arcoTags.forEach((arcoTag: any) => {
          const tag = arc.ele('TAG');
          tag.ele('URI').txt(arcoTag.arcoUri);
          tag.ele('LABEL').txt(arcoTag.label);
          tag.ele('CATEGORY').txt(arcoTag.category);
          if (arcoTag.notation) {
            tag.ele('NOTATION').txt(arcoTag.notation);
          }
        });
      }

      // TU - Technical Data
      const tu = record.ele('TU');
      const dtt = tu.ele('DTT');
      dtt.ele('DTTN').txt(asset.filename);
      dtt.ele('DTTM').txt(asset.mimeType);
      dtt.ele('DTTS').txt(String(asset.fileSize));

      if (asset.width && asset.height) {
        const dim = tu.ele('DIM');
        dim.ele('DIMW').txt(String(asset.width));
        dim.ele('DIMH').txt(String(asset.height));
      }

      // RS - Relations
      const rs = record.ele('RS');
      rs.ele('RSL').txt(asset.sharepointUrl);

      // CM - Compilation
      const cm = record.ele('CM');
      if (asset.creator) {
        cm.ele('CMP').ele('CMPN').txt(asset.creator.name);
      }
      if (asset.createdAt) {
        cm.ele('CMR').ele('CMPD').txt(asset.createdAt.toISOString().split('T')[0]);
      }
    });

    const xml = root.end({ prettyPrint: true });

    logger.info(`Generated ICCD XML collection for ${assets.length} assets`);

    return xml;
  }

  /**
   * Validate ICCD XML against schema (simplified validation)
   */
  validateICCDXML(xml: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation checks
    if (!xml.includes('xmlns="http://www.iccd.beniculturali.it/ns"')) {
      errors.push('Missing ICCD namespace declaration');
    }

    if (!xml.includes('<CD>')) {
      errors.push('Missing CD (Identification) section');
    }

    if (!xml.includes('<OG>')) {
      errors.push('Missing OG (Object) section');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
