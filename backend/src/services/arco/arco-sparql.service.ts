// ArCo SPARQL Service
// Handles SPARQL queries to ArCo knowledge base

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { InternalServerError } from '../../utils/errors';

export interface ArCoEntity {
  uri: string;
  label: string;
  notation?: string;
  description?: string;
  category: string;
}

export interface SparqlResult {
  results: {
    bindings: Array<{
      [key: string]: {
        type: string;
        value: string;
        'xml:lang'?: string;
      };
    }>;
  };
}

export class ArCoSparqlService {
  private client: AxiosInstance;
  private endpoint: string;

  constructor() {
    this.endpoint = config.arco.sparqlEndpoint;
    this.client = axios.create({
      baseURL: this.endpoint,
      timeout: 30000, // 30 seconds
      headers: {
        'Accept': 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Execute SPARQL query
   */
  async executeQuery(query: string): Promise<SparqlResult> {
    try {
      logger.debug('Executing SPARQL query:', { query });

      const response = await this.client.post('',
        new URLSearchParams({ query }).toString()
      );

      return response.data as SparqlResult;
    } catch (error: any) {
      logger.error('SPARQL query error:', {
        error: error.message,
        query,
        response: error.response?.data,
      });
      throw new InternalServerError('Failed to execute SPARQL query');
    }
  }

  /**
   * Search cultural property types (Beni Culturali)
   * Uses ArCo Cultural Property ontology
   */
  async searchCulturalPropertyTypes(searchTerm: string, limit: number = 20): Promise<ArCoEntity[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX arco: <https://w3id.org/arco/ontology/arco/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?notation ?description
      WHERE {
        ?uri rdf:type arco:CulturalPropertyType .
        ?uri skos:prefLabel ?label .
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:definition ?description }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
        FILTER(REGEX(?label, "${this.escapeSparql(searchTerm)}", "i"))
      }
      ORDER BY ?label
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);
    return this.parseArCoEntities(result, 'CULTURAL_PROPERTY_TYPE');
  }

  /**
   * Search materials (Materiali)
   */
  async searchMaterials(searchTerm: string, limit: number = 20): Promise<ArCoEntity[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX arco: <https://w3id.org/arco/ontology/arco/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?notation ?description
      WHERE {
        ?uri rdf:type arco:Material .
        ?uri skos:prefLabel ?label .
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:definition ?description }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
        FILTER(REGEX(?label, "${this.escapeSparql(searchTerm)}", "i"))
      }
      ORDER BY ?label
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);
    return this.parseArCoEntities(result, 'MATERIAL');
  }

  /**
   * Search techniques (Tecniche)
   */
  async searchTechniques(searchTerm: string, limit: number = 20): Promise<ArCoEntity[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX arco: <https://w3id.org/arco/ontology/arco/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?notation ?description
      WHERE {
        ?uri rdf:type arco:TechnicalCharacteristic .
        ?uri skos:prefLabel ?label .
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:definition ?description }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
        FILTER(REGEX(?label, "${this.escapeSparql(searchTerm)}", "i"))
      }
      ORDER BY ?label
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);
    return this.parseArCoEntities(result, 'TECHNIQUE');
  }

  /**
   * Search subjects (Soggetti)
   */
  async searchSubjects(searchTerm: string, limit: number = 20): Promise<ArCoEntity[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX arco: <https://w3id.org/arco/ontology/arco/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?notation ?description
      WHERE {
        ?uri rdf:type arco:Subject .
        ?uri skos:prefLabel ?label .
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:definition ?description }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
        FILTER(REGEX(?label, "${this.escapeSparql(searchTerm)}", "i"))
      }
      ORDER BY ?label
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);
    return this.parseArCoEntities(result, 'SUBJECT');
  }

  /**
   * Search locations (Luoghi)
   */
  async searchLocations(searchTerm: string, limit: number = 20): Promise<ArCoEntity[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX arco: <https://w3id.org/arco/ontology/arco/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?notation ?description
      WHERE {
        ?uri rdf:type arco:GeographicLocation .
        ?uri skos:prefLabel ?label .
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:definition ?description }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
        FILTER(REGEX(?label, "${this.escapeSparql(searchTerm)}", "i"))
      }
      ORDER BY ?label
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);
    return this.parseArCoEntities(result, 'CURRENT_LOCATION');
  }

  /**
   * Search historical periods (Periodi storici)
   */
  async searchHistoricalPeriods(searchTerm: string, limit: number = 20): Promise<ArCoEntity[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX arco: <https://w3id.org/arco/ontology/arco/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?notation ?description
      WHERE {
        ?uri rdf:type arco:HistoricalPeriod .
        ?uri skos:prefLabel ?label .
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:definition ?description }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
        FILTER(REGEX(?label, "${this.escapeSparql(searchTerm)}", "i"))
      }
      ORDER BY ?label
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);
    return this.parseArCoEntities(result, 'HISTORICAL_PERIOD');
  }

  /**
   * Get all entities for a category (for caching)
   */
  async getAllEntitiesForCategory(category: string, limit: number = 1000): Promise<ArCoEntity[]> {
    let typeUri: string;

    switch (category) {
      case 'CULTURAL_PROPERTY_TYPE':
        typeUri = 'arco:CulturalPropertyType';
        break;
      case 'MATERIAL':
        typeUri = 'arco:Material';
        break;
      case 'TECHNIQUE':
        typeUri = 'arco:TechnicalCharacteristic';
        break;
      case 'SUBJECT':
        typeUri = 'arco:Subject';
        break;
      case 'CURRENT_LOCATION':
      case 'CREATION_PLACE':
        typeUri = 'arco:GeographicLocation';
        break;
      case 'HISTORICAL_PERIOD':
        typeUri = 'arco:HistoricalPeriod';
        break;
      case 'DATING':
        typeUri = 'arco:Dating';
        break;
      default:
        throw new Error(`Unknown ArCo category: ${category}`);
    }

    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX arco: <https://w3id.org/arco/ontology/arco/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?notation ?description
      WHERE {
        ?uri rdf:type ${typeUri} .
        ?uri skos:prefLabel ?label .
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:definition ?description }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
      }
      ORDER BY ?label
      LIMIT ${limit}
    `;

    const result = await this.executeQuery(query);
    return this.parseArCoEntities(result, category);
  }

  /**
   * Get entity by URI
   */
  async getEntityByUri(uri: string): Promise<ArCoEntity | null> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?label ?notation ?description ?type
      WHERE {
        <${uri}> skos:prefLabel ?label .
        OPTIONAL { <${uri}> skos:notation ?notation }
        OPTIONAL { <${uri}> skos:definition ?description }
        OPTIONAL { <${uri}> rdf:type ?type }

        FILTER(LANG(?label) = "it" || LANG(?label) = "")
      }
      LIMIT 1
    `;

    const result = await this.executeQuery(query);

    if (result.results.bindings.length === 0) {
      return null;
    }

    const binding = result.results.bindings[0];
    const category = this.inferCategoryFromType(binding.type?.value);

    return {
      uri,
      label: binding.label.value,
      notation: binding.notation?.value,
      description: binding.description?.value,
      category,
    };
  }

  /**
   * Parse SPARQL results into ArCoEntity objects
   */
  private parseArCoEntities(result: SparqlResult, category: string): ArCoEntity[] {
    return result.results.bindings.map((binding) => ({
      uri: binding.uri.value,
      label: binding.label.value,
      notation: binding.notation?.value,
      description: binding.description?.value,
      category,
    }));
  }

  /**
   * Escape special characters in SPARQL queries
   */
  private escapeSparql(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Infer category from RDF type URI
   */
  private inferCategoryFromType(typeUri?: string): string {
    if (!typeUri) return 'UNKNOWN';

    if (typeUri.includes('CulturalPropertyType')) return 'CULTURAL_PROPERTY_TYPE';
    if (typeUri.includes('Material')) return 'MATERIAL';
    if (typeUri.includes('TechnicalCharacteristic')) return 'TECHNIQUE';
    if (typeUri.includes('Subject')) return 'SUBJECT';
    if (typeUri.includes('GeographicLocation')) return 'CURRENT_LOCATION';
    if (typeUri.includes('HistoricalPeriod')) return 'HISTORICAL_PERIOD';
    if (typeUri.includes('Dating')) return 'DATING';

    return 'UNKNOWN';
  }

  /**
   * Test connection to SPARQL endpoint
   */
  async testConnection(): Promise<boolean> {
    try {
      const query = 'SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o } LIMIT 1';
      await this.executeQuery(query);
      return true;
    } catch (error) {
      logger.error('ArCo SPARQL endpoint connection test failed:', error);
      return false;
    }
  }
}
