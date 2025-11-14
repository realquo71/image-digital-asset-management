import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { arcoApi } from '../../services/api';
import { ArcoCategory, ArcoEntity } from '../../types';

interface ArcoTagSelectorProps {
  onSelect: (arcoUri: string, category: ArcoCategory, label: string) => void;
  onClose: () => void;
}

const ArcoTagSelector = ({ onSelect, onClose }: ArcoTagSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<ArcoCategory>(
    ArcoCategory.CULTURAL_PROPERTY_TYPE
  );
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: ArcoCategory.CULTURAL_PROPERTY_TYPE, label: 'Cultural Property Type' },
    { value: ArcoCategory.MATERIAL, label: 'Material' },
    { value: ArcoCategory.TECHNIQUE, label: 'Technique' },
    { value: ArcoCategory.SUBJECT, label: 'Subject' },
    { value: ArcoCategory.DATING, label: 'Dating' },
    { value: ArcoCategory.CURRENT_LOCATION, label: 'Current Location' },
    { value: ArcoCategory.CREATION_PLACE, label: 'Creation Place' },
    { value: ArcoCategory.HISTORICAL_PERIOD, label: 'Historical Period' },
  ];

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['arco-search', selectedCategory, searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await arcoApi.searchTerms(selectedCategory, searchQuery);
      return response.data.data;
    },
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSelect = (term: ArcoEntity) => {
    onSelect(term.uri, selectedCategory, term.label);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add ArCo Tag</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ArcoCategory)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Terms
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type at least 2 characters to search..."
                className="input pl-10"
                autoFocus
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
          </div>

          {/* Search Results */}
          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Searching ArCo vocabulary...</p>
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
                <p className="text-sm">Start typing to search ArCo vocabulary</p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {searchResults.map((term) => (
                  <button
                    key={term.uri}
                    onClick={() => handleSelect(term)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{term.label}</div>
                    {term.notation && (
                      <div className="text-sm text-gray-500 mt-1">
                        Code: {term.notation}
                      </div>
                    )}
                    {term.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {term.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
                <p className="text-sm">No results found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <a
              href="https://dati.beniculturali.it/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Powered by ArCo Knowledge Graph
            </a>
          </div>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArcoTagSelector;
