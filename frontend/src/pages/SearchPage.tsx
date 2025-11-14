import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchApi } from '../services/api';
import { SearchFilters, AssetStatus, ArcoCategory } from '../types';

const SearchPage = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: undefined,
    tags: [],
    arcoCategories: [],
    arcoUris: [],
    mimeTypes: [],
    page: 1,
    limit: 20,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', filters],
    queryFn: async () => {
      const response = await searchApi.advancedSearch(filters);
      return response.data.data;
    },
    enabled: !!filters.query || filters.tags!.length > 0 || filters.arcoCategories!.length > 0,
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Query will trigger automatically via useQuery
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleArrayFilter = (key: 'arcoCategories' | 'mimeTypes', value: string) => {
    const current = filters[key] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    handleFilterChange(key, newValue);
  };

  const arcoCategories = [
    { value: ArcoCategory.CULTURAL_PROPERTY_TYPE, label: 'Cultural Property Type' },
    { value: ArcoCategory.MATERIAL, label: 'Material' },
    { value: ArcoCategory.TECHNIQUE, label: 'Technique' },
    { value: ArcoCategory.SUBJECT, label: 'Subject' },
    { value: ArcoCategory.DATING, label: 'Dating' },
    { value: ArcoCategory.CURRENT_LOCATION, label: 'Current Location' },
    { value: ArcoCategory.CREATION_PLACE, label: 'Creation Place' },
    { value: ArcoCategory.HISTORICAL_PERIOD, label: 'Historical Period' },
  ];

  const mimeTypes = [
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/png', label: 'PNG' },
    { value: 'image/gif', label: 'GIF' },
    { value: 'image/tiff', label: 'TIFF' },
    { value: 'application/pdf', label: 'PDF' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
        <p className="text-gray-600 mt-1">
          Search and filter your digital asset library
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>

            {/* Status Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="input"
              >
                <option value="">All</option>
                <option value={AssetStatus.PUBLISHED}>Published</option>
                <option value={AssetStatus.DRAFT}>Draft</option>
                <option value={AssetStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            {/* ArCo Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ArCo Categories
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {arcoCategories.map((cat) => (
                  <label key={cat.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.arcoCategories?.includes(cat.value)}
                      onChange={() => toggleArrayFilter('arcoCategories', cat.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <div className="space-y-2">
                {mimeTypes.map((type) => (
                  <label key={type.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.mimeTypes?.includes(type.value)}
                      onChange={() => toggleArrayFilter('mimeTypes', type.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input"
              >
                <option value="relevance">Relevance</option>
                <option value="createdAt">Date Added</option>
                <option value="title">Title</option>
                <option value="fileSize">File Size</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setFilters({
                query: '',
                page: 1,
                limit: 20,
                sortBy: 'relevance',
                sortOrder: 'desc',
              })}
              className="w-full btn bg-gray-600 text-white hover:bg-gray-700"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="card p-4 mb-6">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="search"
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  placeholder="Search by title, description, tags..."
                  className="input pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button type="submit" className="btn-primary">
                Search
              </button>
            </div>

            {/* Active Filters Display */}
            {(filters.status || (filters.arcoCategories && filters.arcoCategories.length > 0) || (filters.mimeTypes && filters.mimeTypes.length > 0)) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.status && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                    Status: {filters.status}
                    <button
                      onClick={() => handleFilterChange('status', undefined)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.arcoCategories?.map((cat) => (
                  <span key={cat} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {arcoCategories.find(c => c.value === cat)?.label}
                    <button
                      onClick={() => toggleArrayFilter('arcoCategories', cat)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.mimeTypes?.map((type) => (
                  <span key={type} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {mimeTypes.find(t => t.value === type)?.label}
                    <button
                      onClick={() => toggleArrayFilter('mimeTypes', type)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </form>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Searching...</p>
            </div>
          ) : !searchResults ? (
            <div className="text-center py-12 card">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Searching</h3>
              <p className="text-gray-600">
                Enter keywords or apply filters to find assets
              </p>
            </div>
          ) : searchResults.items.length === 0 ? (
            <div className="text-center py-12 card">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try adjusting your search query or filters
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 text-gray-600">
                Found {searchResults.total} {searchResults.total === 1 ? 'result' : 'results'}
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {searchResults.items.map((asset) => (
                  <Link
                    key={asset.id}
                    to={`/assets/${asset.id}`}
                    className="card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      <img
                        src={asset.thumbnailUrl || '/placeholder-image.png'}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 truncate">{asset.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {searchResults.pages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(searchResults.page - 1)}
                    disabled={searchResults.page === 1}
                    className="btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700">
                    Page {searchResults.page} of {searchResults.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(searchResults.page + 1)}
                    disabled={searchResults.page === searchResults.pages}
                    className="btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
