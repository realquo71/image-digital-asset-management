import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchAssets } from '../../store/slices/assetsSlice';
import { setViewMode, toggleAssetSelection, selectAllAssets, clearAssetSelection } from '../../store/slices/uiSlice';
import { AssetStatus } from '../../types';
import { downloadApi } from '../../services/api';
import { toast } from 'react-toastify';
import ExportModal from '../../components/assets/ExportModal';

const AssetsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: assets, isLoading, pagination } = useSelector((state: RootState) => state.assets);
  const { viewMode, selectedAssets } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
  });
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAssets({
      page: filters.page,
      limit: 20,
      status: filters.status || undefined,
    }));
  }, [dispatch, filters]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    setSearchParams({ ...newFilters, page: '1' });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    setSearchParams({ ...filters, page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkDownload = async () => {
    if (selectedAssets.length === 0) {
      toast.warning('Please select assets to download');
      return;
    }

    try {
      toast.info('Preparing download...');
      const response = await downloadApi.bulkDownload(selectedAssets);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assets-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${selectedAssets.length} assets`);
      dispatch(clearAssetSelection());
    } catch (error) {
      toast.error('Failed to download assets');
    }
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === assets.length) {
      dispatch(clearAssetSelection());
    } else {
      dispatch(selectAllAssets(assets.map(a => a.id)));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} total assets
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {(user?.role === 'ADMIN' || user?.role === 'CURATOR') && (
            <Link to="/assets/upload" className="btn-primary">
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload
            </Link>
          )}
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input py-2"
            >
              <option value="">All Status</option>
              <option value={AssetStatus.PUBLISHED}>Published</option>
              <option value={AssetStatus.DRAFT}>Draft</option>
              <option value={AssetStatus.ARCHIVED}>Archived</option>
            </select>

            {/* Selection Actions */}
            {selectedAssets.length > 0 && (
              <>
                <button
                  onClick={handleBulkDownload}
                  className="btn bg-green-600 text-white hover:bg-green-700"
                >
                  <svg
                    className="w-5 h-5 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download ({selectedAssets.length})
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export ({selectedAssets.length})
                </button>
                <button
                  onClick={() => dispatch(clearAssetSelection())}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-gray-600 hover:text-gray-900 mr-4"
            >
              {selectedAssets.length === assets.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={() => dispatch(setViewMode('grid'))}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => dispatch(setViewMode('list'))}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Assets Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No assets found</h3>
          <p className="text-gray-600 mb-4">Start by uploading some digital assets</p>
          {(user?.role === 'ADMIN' || user?.role === 'CURATOR') && (
            <Link to="/assets/upload" className="btn-primary inline-flex items-center">
              Upload Assets
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`card overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                selectedAssets.includes(asset.id) ? 'ring-2 ring-primary-600' : ''
              }`}
            >
              <div
                className="relative aspect-square bg-gray-100"
                onClick={() => dispatch(toggleAssetSelection(asset.id))}
              >
                <img
                  src={asset.thumbnailUrl || '/placeholder-image.png'}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
                {selectedAssets.includes(asset.id) && (
                  <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <Link to={`/assets/${asset.id}`} className="block p-3">
                <h3 className="font-medium text-gray-900 truncate">{asset.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                  asset.status === AssetStatus.PUBLISHED
                    ? 'bg-green-100 text-green-800'
                    : asset.status === AssetStatus.DRAFT
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {asset.status}
                </span>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              className={`flex items-center p-4 hover:bg-gray-50 ${
                index !== 0 ? 'border-t border-gray-200' : ''
              } ${selectedAssets.includes(asset.id) ? 'bg-primary-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedAssets.includes(asset.id)}
                onChange={() => dispatch(toggleAssetSelection(asset.id))}
                className="mr-4"
              />
              <img
                src={asset.thumbnailUrl || '/placeholder-image.png'}
                alt={asset.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="ml-4 flex-1">
                <Link
                  to={`/assets/${asset.id}`}
                  className="font-medium text-gray-900 hover:text-primary-600"
                >
                  {asset.title}
                </Link>
                <p className="text-sm text-gray-500">{asset.filename}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900">
                  {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                  asset.status === AssetStatus.PUBLISHED
                    ? 'bg-green-100 text-green-800'
                    : asset.status === AssetStatus.DRAFT
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {asset.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          assetIds={selectedAssets}
          mode="multiple"
        />
      )}
    </div>
  );
};

export default AssetsPage;
