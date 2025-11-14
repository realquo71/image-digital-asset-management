# Cultural Heritage Digital Asset Management System
## Phase 1 MVP - Detailed Specifications v1.0 (Part 2)

**Continued from Part 1**

---

## 6. Frontend Components Specification

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── SearchBar
│   │   └── UserMenu
│   ├── Sidebar
│   │   └── Navigation
│   └── Footer
│
├── Pages
│   ├── DashboardPage
│   │   ├── StatsCard
│   │   ├── RecentAssets
│   │   └── ActivityChart
│   │
│   ├── AssetsPage
│   │   ├── AssetGrid
│   │   │   └── AssetCard
│   │   ├── FilterPanel
│   │   └── Pagination
│   │
│   ├── AssetDetailPage
│   │   ├── AssetViewer
│   │   ├── AssetMetadata
│   │   ├── TagList
│   │   ├── ArCoTagList
│   │   └── ActionButtons
│   │
│   ├── AssetUploadPage
│   │   └── AssetUploadForm
│   │       ├── FileDropzone
│   │       ├── MetadataForm
│   │       └── ArCoTagSelector
│   │
│   ├── CollectionsPage
│   │   ├── CollectionGrid
│   │   │   └── CollectionCard
│   │   └── CreateCollectionModal
│   │
│   ├── CollectionDetailPage
│   │   ├── CollectionHeader
│   │   └── AssetGrid
│   │
│   └── SearchPage
│       ├── SearchFilters
│       ├── SearchResults
│       └── Pagination
```

### Key Component Specifications

#### AssetCard Component

**Purpose**: Display asset thumbnail with basic info in grid view

**Props:**
```typescript
interface AssetCardProps {
  asset: Asset;
  onSelect?: (asset: Asset) => void;
  onAddToCollection?: (asset: Asset) => void;
  showActions?: boolean;
  selected?: boolean;
}
```

**Features:**
- Thumbnail image with lazy loading
- Title and truncated description
- Status badge (DRAFT, PUBLISHED, ARCHIVED)
- Tag pills (max 3 visible)
- Hover overlay with action buttons
- Checkbox for bulk selection
- Click navigates to detail page

**Visual Structure:**
```
┌─────────────────────────┐
│                         │
│     [Thumbnail]         │
│                         │
├─────────────────────────┤
│ Title                   │
│ Description...      [•] │
│ [tag1] [tag2]          │
└─────────────────────────┘
```

**Implementation:**
```typescript
// frontend/src/components/organisms/AssetCard/AssetCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../../../types';
import './AssetCard.css';

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onSelect,
  onAddToCollection,
  showActions = true,
  selected = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) {
      onSelect(asset);
    } else {
      navigate(`/assets/${asset.id}`);
    }
  };

  return (
    <div 
      className={`asset-card ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      data-testid="asset-card"
    >
      {/* Thumbnail */}
      <div className="asset-card__thumbnail">
        <img
          src={asset.thumbnailUrl || asset.sharepointUrl}
          alt={asset.title}
          loading="lazy"
        />
        {showActions && (
          <div className="asset-card__overlay">
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCollection?.(asset);
              }}
              title="Add to collection"
            >
              <i className="icon-plus" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="asset-card__content">
        <h3 className="asset-card__title">{asset.title}</h3>
        
        {asset.description && (
          <p className="asset-card__description">
            {asset.description.substring(0, 80)}...
          </p>
        )}

        {/* Status Badge */}
        <span className={`badge badge-${asset.status.toLowerCase()}`}>
          {asset.status}
        </span>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="asset-card__tags">
            {asset.tags.slice(0, 3).map(tag => (
              <span key={tag.id} className="tag-pill">
                {tag.name}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="tag-pill-more">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

#### ArCoTagSelector Component

**Purpose**: Search and select ArCo vocabulary terms

**Props:**
```typescript
interface ArCoTagSelectorProps {
  category: ArCoCat;
  selectedTags: ArCoTerm[];
  onTagsChange: (tags: ArCoTerm[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxTags?: number;
}
```

**Features:**
- Debounced autocomplete search (300ms)
- Hierarchical term display (broader/narrower)
- Definition tooltip on hover
- Selected tags as removable pills
- Recently used terms suggestion
- Loading state indicator
- Error handling

**Implementation:**
```typescript
// frontend/src/components/organisms/ArCoTagSelector/ArCoTagSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useArCoAutocomplete } from '../../../hooks/useArCoAutocomplete';
import { ArCoCat, ArCoTerm } from '../../../types';
import './ArCoTagSelector.css';

export const ArCoTagSelector: React.FC<ArCoTagSelectorProps> = ({
  category,
  selectedTags,
  onTagsChange,
  label,
  required = false,
  disabled = false,
  maxTags
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions, loading } = useArCoAutocomplete(category, query);

  const handleAddTag = (term: ArCoTerm) => {
    // Check if already selected
    if (selectedTags.find(t => t.uri === term.uri)) {
      return;
    }

    // Check max tags limit
    if (maxTags && selectedTags.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`);
      return;
    }

    onTagsChange([...selectedTags, term]);
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (uri: string) => {
    onTagsChange(selectedTags.filter(t => t.uri !== uri));
  };

  return (
    <div className="arco-tag-selector">
      {label && (
        <label className="arco-tag-selector__label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      {/* Selected Tags */}
      <div className="arco-tag-selector__selected">
        {selectedTags.map(tag => (
          <span key={tag.uri} className="arco-tag-pill">
            <span className="arco-tag-pill__label">{tag.label}</span>
            {tag.notation && (
              <span className="arco-tag-pill__notation">({tag.notation})</span>
            )}
            {!disabled && (
              <button
                type="button"
                className="arco-tag-pill__remove"
                onClick={() => handleRemoveTag(tag.uri)}
                aria-label={`Remove ${tag.label}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Autocomplete Input */}
      {!disabled && (
        <div className="arco-tag-selector__input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="arco-tag-selector__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={`Cerca ${getCategoryLabel(category)}...`}
            disabled={disabled}
          />

          {loading && (
            <div className="arco-tag-selector__loading">
              <i className="icon-spinner" />
            </div>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="arco-tag-selector__suggestions">
              {suggestions.map(term => (
                <li
                  key={term.uri}
                  className="arco-suggestion"
                  onClick={() => handleAddTag(term)}
                  role="button"
                >
                  <div className="arco-suggestion__header">
                    <strong>{term.label}</strong>
                    {term.notation && (
                      <span className="arco-suggestion__notation">
                        {term.notation}
                      </span>
                    )}
                  </div>
                  {term.definition && (
                    <p className="arco-suggestion__definition">
                      {term.definition.slice(0, 100)}
                      {term.definition.length > 100 && '...'}
                    </p>
                  )}
                  {term.broader && term.broader.length > 0 && (
                    <div className="arco-suggestion__hierarchy">
                      <small>Broader: {term.broader[0]}</small>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const getCategoryLabel = (category: ArCoCat): string => {
  const labels: Record<ArCoCat, string> = {
    CULTURAL_PROPERTY_TYPE: 'tipo di bene culturale',
    MATERIAL: 'materiale',
    TECHNIQUE: 'tecnica',
    SUBJECT: 'soggetto',
    AUTHOR: 'autore',
    CHRONOLOGY: 'cronologia',
    LOCATION: 'localizzazione',
    CONSERVATION_STATUS: 'stato di conservazione'
  };
  return labels[category];
};
```

---

#### AssetUploadForm Component

**Purpose**: Complete form for uploading assets with metadata and ArCo tags

**Features:**
- File dropzone with drag-and-drop
- File validation (type, size)
- EXIF preview (if image)
- Metadata fields (title, description)
- ArCo tag selectors for all 8 categories
- Upload progress bar
- Success/error notifications

**Implementation:**
```typescript
// frontend/src/components/pages/AssetUploadPage/AssetUploadForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../hooks/redux';
import { uploadAsset } from '../../../store/slices/assets.slice';
import { FileDropzone } from '../../molecules/FileDropzone';
import { ArCoTagSelector } from '../../organisms/ArCoTagSelector';
import { ArCoCat } from '../../../types';

export const AssetUploadForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // ArCo tags state for each category
  const [culturalPropertyType, setCulturalPropertyType] = useState<ArCoTerm[]>([]);
  const [materials, setMaterials] = useState<ArCoTerm[]>([]);
  const [technique, setTechnique] = useState<ArCoTerm[]>([]);
  const [subject, setSubject] = useState<ArCoTerm[]>([]);
  const [author, setAuthor] = useState<ArCoTerm[]>([]);
  const [chronology, setChronology] = useState<ArCoTerm[]>([]);
  const [location, setLocation] = useState<ArCoTerm[]>([]);
  const [conservation, setConservation] = useState<ArCoTerm[]>([]);

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!file) {
      newErrors.file = 'File is required';
    }

    if (!title || title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (culturalPropertyType.length === 0) {
      newErrors.culturalPropertyType = 'Cultural property type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setUploading(true);

    try {
      // Combine all ArCo tags
      const arcoTags = [
        ...culturalPropertyType.map(t => ({ ...t, category: ArCoCat.CULTURAL_PROPERTY_TYPE })),
        ...materials.map(t => ({ ...t, category: ArCoCat.MATERIAL })),
        ...technique.map(t => ({ ...t, category: ArCoCat.TECHNIQUE })),
        ...subject.map(t => ({ ...t, category: ArCoCat.SUBJECT })),
        ...author.map(t => ({ ...t, category: ArCoCat.AUTHOR })),
        ...chronology.map(t => ({ ...t, category: ArCoCat.CHRONOLOGY })),
        ...location.map(t => ({ ...t, category: ArCoCat.LOCATION })),
        ...conservation.map(t => ({ ...t, category: ArCoCat.CONSERVATION_STATUS }))
      ];

      const result = await dispatch(uploadAsset({
        file: file!,
        metadata: {
          title,
          description,
          status,
          arcoTags
        }
      })).unwrap();

      // Success - navigate to asset detail
      navigate(`/assets/${result.id}`);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="asset-upload-form">
      <h1>Upload Asset</h1>

      {/* File Upload */}
      <section className="form-section">
        <h2>File</h2>
        <FileDropzone
          onFileSelect={setFile}
          accept="image/jpeg,image/png,image/tiff,application/pdf"
          maxSize={100 * 1024 * 1024} // 100MB
        />
        {errors.file && <span className="error">{errors.file}</span>}
        {file && (
          <div className="file-preview">
            <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </section>

      {/* Basic Metadata */}
      <section className="form-section">
        <h2>Metadata</h2>

        <div className="form-field">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter asset title"
            required
          />
          {errors.title && <span className="error">{errors.title}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter asset description"
            rows={4}
          />
        </div>

        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </section>

      {/* ArCo Tagging */}
      <section className="form-section">
        <h2>ArCo Classification</h2>
        <p className="help-text">
          Tag this asset using standardized cultural heritage vocabulary
        </p>

        <ArCoTagSelector
          category={ArCoCat.CULTURAL_PROPERTY_TYPE}
          selectedTags={culturalPropertyType}
          onTagsChange={setCulturalPropertyType}
          label="Tipo di Bene Culturale"
          required
          maxTags={1}
        />
        {errors.culturalPropertyType && (
          <span className="error">{errors.culturalPropertyType}</span>
        )}

        <ArCoTagSelector
          category={ArCoCat.MATERIAL}
          selectedTags={materials}
          onTagsChange={setMaterials}
          label="Materiali"
        />

        <ArCoTagSelector
          category={ArCoCat.TECHNIQUE}
          selectedTags={technique}
          onTagsChange={setTechnique}
          label="Tecnica"
        />

        <ArCoTagSelector
          category={ArCoCat.SUBJECT}
          selectedTags={subject}
          onTagsChange={setSubject}
          label="Soggetto"
        />

        <ArCoTagSelector
          category={ArCoCat.AUTHOR}
          selectedTags={author}
          onTagsChange={setAuthor}
          label="Autore"
        />

        <ArCoTagSelector
          category={ArCoCat.CHRONOLOGY}
          selectedTags={chronology}
          onTagsChange={setChronology}
          label="Cronologia"
        />

        <ArCoTagSelector
          category={ArCoCat.LOCATION}
          selectedTags={location}
          onTagsChange={setLocation}
          label="Localizzazione"
        />

        <ArCoTagSelector
          category={ArCoCat.CONSERVATION_STATUS}
          selectedTags={conservation}
          onTagsChange={setConservation}
          label="Stato di Conservazione"
        />
      </section>

      {/* Submit */}
      {errors.submit && (
        <div className="alert alert-error">{errors.submit}</div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/assets')}
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Asset'}
        </button>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '45%' }} />
          </div>
          <span>Uploading... 45%</span>
        </div>
      )}
    </form>
  );
};
```

---

## 7. Backend Services Specification

### Service Layer Architecture

```
Controllers → Services → Repositories → Database
                ↓
           External APIs
```

### Core Services

#### AssetService

**Responsibilities:**
- Asset CRUD operations
- File upload to SharePoint
- EXIF metadata extraction
- Thumbnail generation
- Search indexing

**Methods:**
```typescript
class AssetService {
  async uploadAsset(file: Express.Multer.File, metadata: CreateAssetDto, userId: string): Promise<Asset>
  async getAssetById(id: string): Promise<Asset | null>
  async listAssets(filters: AssetFilters): Promise<PaginatedResult<Asset>>
  async updateAsset(id: string, data: UpdateAssetDto): Promise<Asset>
  async deleteAsset(id: string): Promise<void>
  async addTags(assetId: string, tags: string[]): Promise<Asset>
  async addArCoTags(assetId: string, tags: ArCoTagInput[]): Promise<Asset>
  async downloadAsset(id: string): Promise<{ buffer: Buffer; filename: string; mimeType: string }>
  async generateThumbnail(id: string, width?: number): Promise<Buffer>
}
```

**Implementation Highlights:**
```typescript
// backend/src/services/asset.service.ts
export class AssetService {
  constructor(
    private assetRepository: AssetRepository,
    private sharepointService: SharepointService,
    private searchService: SearchService,
    private imageService: ImageProcessingService,
    private auditService: AuditService
  ) {}

  async uploadAsset(
    file: Express.Multer.File,
    metadata: CreateAssetDto,
    userId: string
  ): Promise<Asset> {
    // 1. Validate file
    this.validateFile(file);

    // 2. Upload to SharePoint
    const { url: sharepointUrl, id: sharepointId } = 
      await this.sharepointService.uploadFile(file.buffer, file.originalname);

    // 3. Extract EXIF
    const exif = await this.imageService.extractExif(file.buffer);

    // 4. Generate thumbnail
    const thumbnail = await this.imageService.generateThumbnail(file.buffer);
    const thumbnailUrl = await this.sharepointService.uploadFile(
      thumbnail,
      `thumb_${file.originalname}`
    );

    // 5. Save to database
    const asset = await this.assetRepository.create({
      title: metadata.title,
      description: metadata.description,
      filename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      sharepointUrl,
      sharepointId,
      thumbnailUrl: thumbnailUrl.url,
      status: metadata.status || 'DRAFT',
      ...exif,
      creatorId: userId
    });

    // 6. Index in Elasticsearch
    await this.searchService.indexAsset(asset);

    // 7. Add ArCo tags if provided
    if (metadata.arcoTags && metadata.arcoTags.length > 0) {
      await this.addArCoTags(asset.id, metadata.arcoTags);
    }

    // 8. Audit log
    await this.auditService.log({
      action: 'ASSET_CREATE',
      userId,
      entityType: 'Asset',
      entityId: asset.id
    });

    return asset;
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/pdf'
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new ValidationError([{
        field: 'file',
        message: `File type ${file.mimetype} not allowed`
      }]);
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new ValidationError([{
        field: 'file',
        message: 'File size must be less than 100MB'
      }]);
    }
  }
}
```

---

#### ArcoService

**Responsibilities:**
- ArCo vocabulary search
- SPARQL query execution
- Term caching
- Autocomplete suggestions

**Methods:**
```typescript
class ArcoService {
  async searchTerms(category: ArCoCat, query: string, limit?: number): Promise<ArCoTerm[]>
  async getTerm(uri: string): Promise<ArCoTerm | null>
  async getVocabulary(category: ArCoCat, limit?: number): Promise<ArCoTerm[]>
  async getTermHierarchy(uri: string): Promise<{ broader: ArCoTerm[]; narrower: ArCoTerm[] }>
  async suggestTerms(category: ArCoCat, partialQuery: string): Promise<ArCoTerm[]>
  async incrementUsage(uri: string): Promise<void>
}
```

**Implementation:**
```typescript
// backend/src/services/arco.service.ts
export class ArcoService {
  constructor(
    private cacheService: CacheService,
    private prisma: PrismaClient,
    private sparqlClient: SparqlClient
  ) {}

  async searchTerms(
    category: ArCoCat,
    query: string,
    limit: number = 20
  ): Promise<ArCoTerm[]> {
    // Try cache first
    const cached = await this.cacheService.wrap(
      `arco:search:${category}:${query}`,
      3600, // 1 hour
      async () => {
        // Search in local cache (PostgreSQL)
        const results = await this.prisma.arCoVocabularyCache.findMany({
          where: {
            category,
            OR: [
              { label: { contains: query, mode: 'insensitive' } },
              { altLabels: { has: query } }
            ]
          },
          take: limit,
          orderBy: [
            { usageCount: 'desc' }, // Popular terms first
            { label: 'asc' }
          ]
        });

        return results.map(this.mapToArCoTerm);
      }
    );

    return cached;
  }

  async getTerm(uri: string): Promise<ArCoTerm | null> {
    return await this.cacheService.wrap(
      `arco:term:${uri}`,
      604800, // 1 week
      async () => {
        // Try local cache
        const cached = await this.prisma.arCoVocabularyCache.findUnique({
          where: { uri }
        });

        if (cached) {
          return this.mapToArCoTerm(cached);
        }

        // Fallback to SPARQL
        const term = await this.fetchTermFromSparql(uri);
        
        if (term) {
          // Cache for future use
          await this.prisma.arCoVocabularyCache.create({
            data: term
          });
        }

        return term;
      }
    );
  }

  private async fetchTermFromSparql(uri: string): Promise<ArCoTerm | null> {
    const query = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      
      SELECT ?label ?definition ?notation ?broader ?altLabel
      WHERE {
        <${uri}> skos:prefLabel ?label .
        OPTIONAL { <${uri}> skos:definition ?definition }
        OPTIONAL { <${uri}> skos:notation ?notation }
        OPTIONAL { <${uri}> skos:broader ?broader }
        OPTIONAL { <${uri}> skos:altLabel ?altLabel }
        
        FILTER (LANG(?label) = "it" || LANG(?label) = "")
      }
      LIMIT 1
    `;

    const results = await this.sparqlClient.query.select(query);
    const rows = [];
    
    for await (const row of results) {
      rows.push(row);
    }

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      uri,
      label: row.label.value,
      definition: row.definition?.value,
      notation: row.notation?.value,
      broader: row.broader ? [row.broader.value] : [],
      narrower: [],
      related: [],
      altLabels: row.altLabel ? [row.altLabel.value] : []
    };
  }

  private mapToArCoTerm(cached: ArCoVocabularyCache): ArCoTerm {
    return {
      uri: cached.uri,
      label: cached.label,
      definition: cached.definition || undefined,
      notation: cached.notation || undefined,
      broader: cached.broader,
      narrower: cached.narrower,
      related: cached.related,
      altLabels: cached.altLabels
    };
  }
}
```

---

## 8. ArCo Integration MVP

### Vocabulary Sync Strategy

**Initial Sync:**
- Run once during deployment
- Sync all 8 categories
- ~1000 most common terms per category
- Store in `arco_vocabulary_cache` table

**Incremental Sync:**
- Scheduled weekly (Sunday 2 AM)
- Fetch new terms
- Update existing definitions
- Remove deprecated terms

**Implementation:**
```typescript
// backend/src/jobs/arco-sync.job.ts
import { CronJob } from 'cron';

export class ArcoSyncJob {
  constructor(
    private arcoSyncService: ArcoSyncService,
    private logger: Logger
  ) {}

  start() {
    // Weekly sync: Every Sunday at 2 AM
    const job = new CronJob('0 2 * * 0', async () => {
      this.logger.info('Starting weekly ArCo vocabulary sync');

      try {
        const categories = Object.values(ArCoCat);
        const results: Record<string, number> = {};

        for (const category of categories) {
          const count = await this.arcoSyncService.syncVocabulary(category);
          results[category] = count;
          this.logger.info(`Synced ${count} terms for ${category}`);
        }

        this.logger.info('ArCo sync completed', results);

        // Notify admins
        await this.notificationService.notifyAdmins(
          'ArCo Sync Completed',
          `Successfully synced ${Object.values(results).reduce((a, b) => a + b, 0)} terms`
        );

      } catch (error) {
        this.logger.error('ArCo sync failed:', error);
        
        await this.notificationService.notifyAdmins(
          'ArCo Sync Failed',
          `Error: ${error.message}`
        );
      }
    });

    job.start();
    this.logger.info('ArCo sync job scheduled');
  }
}
```

### SPARQL Query Optimization

**Best Practices:**
- Limit results to 1000 per query
- Use specific filters (language, type)
- Cache aggressively (1 week for terms)
- Implement request batching
- Handle timeouts gracefully

---

## 9. Authentication & Authorization

### Azure AD Configuration

**App Registration:**
1. Create app in Azure AD
2. Add redirect URIs
3. Configure API permissions:
   - User.Read
   - Files.ReadWrite.All (for SharePoint)
4. Generate client secret
5. Note tenant ID, client ID

**Environment Variables:**
```env
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_REDIRECT_URI=http://localhost:3000/auth/callback
```

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "curator@museum.it",
  "name": "Maria Rossi",
  "role": "CURATOR",
  "azureAdId": "azure-ad-object-id",
  "iat": 1699000000,
  "exp": 1699086400,
  "iss": "dam-backend",
  "aud": "dam-frontend"
}
```

### Permission Matrix

| Resource | Action | ADMIN | CURATOR | RESEARCHER | VIEWER |
|----------|--------|-------|---------|------------|--------|
| Asset | View Published | ✅ | ✅ | ✅ | ✅ |
| Asset | View Draft | ✅ | ✅ | ❌ | ❌ |
| Asset | Create | ✅ | ✅ | ❌ | ❌ |
| Asset | Edit Own | ✅ | ✅ | ❌ | ❌ |
| Asset | Edit Any | ✅ | ❌ | ❌ | ❌ |
| Asset | Delete Own | ✅ | ✅ | ❌ | ❌ |
| Asset | Delete Any | ✅ | ❌ | ❌ | ❌ |
| Asset | Download | ✅ | ✅ | ✅ | ✅ |
| ArCo Tag | Add/Remove | ✅ | ✅ | ❌ | ❌ |
| Collection | Create | ✅ | ✅ | ✅ | ❌ |
| Collection | Edit Own | ✅ | ✅ | ✅ | ❌ |
| Collection | Delete Own | ✅ | ✅ | ✅ | ❌ |
| User | Manage | ✅ | ❌ | ❌ | ❌ |
| Dashboard | View | ✅ | ✅ | ❌ | ❌ |

---

## 10. Search & Discovery

### Search Implementation Strategy

**Phase 1 MVP**: PostgreSQL Full-Text Search
- Simple, no additional infrastructure
- Good enough for <10k assets
- Easy to implement

**Phase 2**: Elasticsearch
- Better relevance ranking
- Faceted search
- Semantic search with ArCo

### PostgreSQL Full-Text Search

```sql
-- Create tsvector column
ALTER TABLE assets ADD COLUMN search_vector tsvector;

-- Update tsvector on insert/update
CREATE TRIGGER assets_search_vector_update BEFORE INSERT OR UPDATE
ON assets FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.italian', title, description);

-- Create GIN index
CREATE INDEX idx_assets_search_vector ON assets USING GIN (search_vector);

-- Search query
SELECT *
FROM assets
WHERE search_vector @@ plainto_tsquery('italian', 'venus scultura')
ORDER BY ts_rank(search_vector, plainto_tsquery('italian', 'venus scultura')) DESC
LIMIT 20;
```

---

## 11. File Upload & Processing

### Upload Flow

```
1. User selects file → Frontend validation
2. File sent to backend → Server validation
3. Upload to SharePoint → Graph API
4. Extract EXIF → sharp library
5. Generate thumbnail → sharp resize
6. Save metadata → PostgreSQL
7. Index for search → (Future: Elasticsearch)
8. Return success → Frontend
```

### File Processing Pipeline

```typescript
// backend/src/services/image-processing.service.ts
export class ImageProcessingService {
  async processImage(buffer: Buffer): Promise<ProcessedImage> {
    // Extract EXIF
    const exif = await this.extractExif(buffer);
    
    // Generate thumbnail
    const thumbnail = await this.generateThumbnail(buffer, 300);
    
    // Optimize original
    const optimized = await this.optimizeImage(buffer);
    
    return {
      exif,
      thumbnail,
      optimized
    };
  }

  async extractExif(buffer: Buffer): Promise<ExifData> {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };
  }

  async generateThumbnail(buffer: Buffer, width: number): Promise<Buffer> {
    return await sharp(buffer)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
  }

  async optimizeImage(buffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    
    if (metadata.width && metadata.width > 1920) {
      return await sharp(buffer)
        .resize(1920, null, { fit: 'inside' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    }
    
    return buffer;
  }
}
```

---

## 12. Collections Management

### Collection Features MVP

- Create collection with name and description
- Add/remove assets
- Set collection visibility (public/private)
- Set cover image
- Reorder assets (Phase 2)
- Share collection link (Phase 2)

### Implementation

```typescript
// backend/src/services/collection.service.ts
export class CollectionService {
  constructor(
    private collectionRepository: CollectionRepository,
    private assetRepository: AssetRepository,
    private auditService: AuditService
  ) {}

  async createCollection(
    data: CreateCollectionDto,
    userId: string
  ): Promise<Collection> {
    const collection = await this.collectionRepository.create({
      name: data.name,
      description: data.description,
      isPublic: data.isPublic || false,
      creatorId: userId
    });

    await this.auditService.log({
      action: 'COLLECTION_CREATE',
      userId,
      entityType: 'Collection',
      entityId: collection.id
    });

    return collection;
  }

  async addAssets(
    collectionId: string,
    assetIds: string[],
    userId: string
  ): Promise<void> {
    // Verify collection ownership
    const collection = await this.collectionRepository.findById(collectionId);
    if (!collection || collection.creatorId !== userId) {
      throw new ForbiddenError('Cannot modify this collection');
    }

    // Verify assets exist
    const assets = await this.assetRepository.findByIds(assetIds);
    if (assets.length !== assetIds.length) {
      throw new NotFoundError('Asset', 'one or more asset IDs');
    }

    // Add to collection (using junction table)
    await this.collectionRepository.addAssets(collectionId, assetIds);

    await this.auditService.log({
      action: 'COLLECTION_UPDATE',
      userId,
      entityType: 'Collection',
      entityId: collectionId,
      details: { addedAssets: assetIds }
    });
  }
}
```

---

## 13. Audit Trail & Logging

### Audit Events

All these actions are logged:
- Asset create, update, delete, download
- Collection create, update, delete
- Tag add, remove
- ArCo tag add, remove
- User login, logout
- GDPR data export/deletion

### Audit Log Structure

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details?: any;
  changes?: {
    before: any;
    after: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### Query Audit Logs

```typescript
// Get user's activity
await prisma.auditLog.findMany({
  where: {
    userId: 'user-uuid',
    createdAt: {
      gte: new Date('2024-11-01'),
      lte: new Date('2024-11-30')
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 100
});

// Get asset history
await prisma.auditLog.findMany({
  where: {
    entityType: 'Asset',
    entityId: 'asset-uuid'
  },
  include: {
    user: {
      select: { name: true, email: true }
    }
  },
  orderBy: { createdAt: 'asc' }
});
```

---

## 14. Testing Requirements

### Test Coverage Targets

- **Unit Tests**: 80% coverage
- **Integration Tests**: Key API endpoints
- **E2E Tests**: Critical user flows

### Key Test Scenarios

**Unit Tests:**
- AssetService.uploadAsset()
- ArcoService.searchTerms()
- AssetRepository CRUD methods
- Authentication middleware
- Validation schemas

**Integration Tests:**
- POST /api/v1/assets (upload)
- GET /api/v1/assets (list)
- POST /api/v1/assets/:id/arco-tags
- GET /api/v1/arco/search
- POST /api/v1/collections

**E2E Tests:**
- Complete upload flow with ArCo tagging
- Search and filter assets
- Create collection and add assets
- Download asset

### Test Data

```typescript
// tests/fixtures/test-data.ts
export const testUser = {
  id: 'test-user-uuid',
  email: 'test@museum.it',
  name: 'Test User',
  role: 'CURATOR'
};

export const testAsset = {
  id: 'test-asset-uuid',
  title: 'Test Asset',
  description: 'Test description',
  filename: 'test.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1024000,
  sharepointUrl: 'https://sharepoint.com/test.jpg',
  sharepointId: 'sp-test-id',
  status: 'PUBLISHED',
  creatorId: testUser.id
};
```

---

## 15. Deployment Checklist

### Pre-Deployment

- [ ] All 25 MVP requirements implemented
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] ArCo vocabulary synced

### Deployment Steps

1. **Database Setup**
   ```bash
   # Run migrations
   npx prisma migrate deploy
   
   # Seed initial data
   npm run seed
   
   # Run ArCo sync
   npm run arco:sync
   ```

2. **Environment Configuration**
   - Set all required env variables
   - Configure Azure AD app
   - Set up SharePoint permissions
   - Configure monitoring tools

3. **Deploy Application**
   ```bash
   # Build Docker images
   docker build -t dam-backend:v1.0.0 ./backend
   docker build -t dam-frontend:v1.0.0 ./frontend
   
   # Push to registry
   docker push dam-backend:v1.0.0
   docker push dam-frontend:v1.0.0
   
   # Deploy to Kubernetes
   kubectl apply -f k8s/
   ```

4. **Post-Deployment Verification**
   - [ ] Health checks passing
   - [ ] Can log in with Azure AD
   - [ ] Can upload asset
   - [ ] Can tag with ArCo
   - [ ] Can search assets
   - [ ] Can create collection
   - [ ] Can download assets
   - [ ] Monitoring dashboards active
   - [ ] Logs flowing correctly

### Rollback Plan

```bash
# Rollback to previous version
kubectl rollout undo deployment/dam-backend
kubectl rollout undo deployment/dam-frontend

# Restore database if needed
psql dam_prod < backup_20241114.sql
```

---

## Summary

Phase 1 MVP delivers a **functional DAM system** with:
- ✅ 25 core requirements
- ✅ Azure AD authentication
- ✅ Asset upload with EXIF extraction
- ✅ ArCo semantic tagging (8 categories)
- ✅ Advanced search
- ✅ Collections management
- ✅ Role-based access control
- ✅ Audit trail
- ✅ 80%+ test coverage

**Timeline**: 3-4 months  
**Effort**: ~26 developer-weeks  
**Team**: 2-3 developers + 1 PM

**Next Phase**: Phase 2 - Enhanced Features (AI tagging, visual search, workflows)

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2024  
**Status:** Ready for Implementation
