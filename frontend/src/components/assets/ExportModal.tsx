import React, { useState } from 'react';
import { exportApi } from '../../services/api';
import { toast } from 'react-toastify';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetIds: string[];
  mode: 'single' | 'multiple';
}

type ExportFormat = 'iccd' | 'jsonld' | 'turtle' | 'ntriples';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, assetIds, mode }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('iccd');
  const [includeArcoTags, setIncludeArcoTags] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const exportFormats = [
    {
      id: 'iccd' as ExportFormat,
      name: 'ICCD XML',
      description: 'Italian Cultural Heritage Catalog Standard',
      icon: '📄',
      extension: '.xml',
    },
    {
      id: 'jsonld' as ExportFormat,
      name: 'JSON-LD',
      description: 'JSON for Linked Data',
      icon: '🔗',
      extension: '.jsonld',
    },
    {
      id: 'turtle' as ExportFormat,
      name: 'RDF Turtle',
      description: 'Terse RDF Triple Language',
      icon: '🐢',
      extension: '.ttl',
    },
    {
      id: 'ntriples' as ExportFormat,
      name: 'N-Triples',
      description: 'N-Triples RDF Format',
      icon: '⚛️',
      extension: '.nt',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (mode === 'single') {
        const assetId = assetIds[0];

        if (selectedFormat === 'iccd') {
          const response = await exportApi.exportAssetICCD(assetId, includeArcoTags, includeTags);
          downloadBlob(response.data, `asset-${assetId}-iccd.xml`);
        } else if (selectedFormat === 'jsonld') {
          const response = await exportApi.exportAssetJSONLD(assetId, includeArcoTags, includeTags);
          downloadJSON(response.data.data, `asset-${assetId}.jsonld`);
        } else if (selectedFormat === 'turtle') {
          const response = await exportApi.exportAssetTurtle(assetId, includeArcoTags, includeTags);
          downloadBlob(response.data, `asset-${assetId}.ttl`);
        } else if (selectedFormat === 'ntriples') {
          const response = await exportApi.exportAssetNTriples(assetId, includeArcoTags, includeTags);
          downloadBlob(response.data, `asset-${assetId}.nt`);
        }
      } else {
        // Multiple assets
        if (selectedFormat === 'iccd') {
          const response = await exportApi.exportAssetsICCD(assetIds, includeArcoTags, includeTags);
          downloadBlob(response.data, `assets-${assetIds.length}-iccd.xml`);
        } else if (selectedFormat === 'jsonld') {
          const response = await exportApi.exportAssetsJSONLD(assetIds, includeArcoTags, includeTags);
          downloadJSON(response.data.data, `assets-${assetIds.length}.jsonld`);
        }
        // Note: Turtle and N-Triples only support single asset export
      }

      toast.success(`Successfully exported ${assetIds.length} asset(s) as ${selectedFormat.toUpperCase()}`);
      onClose();
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to export assets');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadJSON = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, filename);
  };

  const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat);
  const isMultipleUnsupported = mode === 'multiple' && (selectedFormat === 'turtle' || selectedFormat === 'ntriples');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Export Asset{mode === 'multiple' ? 's' : ''}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Export format selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Export Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exportFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    disabled={mode === 'multiple' && (format.id === 'turtle' || format.id === 'ntriples')}
                    className={`
                      relative p-4 border-2 rounded-lg text-left transition-all
                      ${selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${mode === 'multiple' && (format.id === 'turtle' || format.id === 'ntriples')
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{format.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{format.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{format.description}</p>
                        {mode === 'multiple' && (format.id === 'turtle' || format.id === 'ntriples') && (
                          <p className="text-xs text-red-500 mt-1">Single asset only</p>
                        )}
                      </div>
                      {selectedFormat === format.id && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeArcoTags}
                    onChange={(e) => setIncludeArcoTags(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include ArCo semantic tags</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTags}
                    onChange={(e) => setIncludeTags(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include free-form tags</span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Export Summary</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Assets:</dt>
                <dd className="text-gray-900 font-medium">{assetIds.length}</dd>

                <dt className="text-gray-500">Format:</dt>
                <dd className="text-gray-900 font-medium">{selectedFormatInfo?.name}</dd>

                <dt className="text-gray-500">File type:</dt>
                <dd className="text-gray-900 font-medium">{selectedFormatInfo?.extension}</dd>
              </dl>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || isMultipleUnsupported}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
