import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  fetchCollection,
  updateCollection,
  addAssetToCollection,
  removeAssetFromCollection,
} from '../../store/slices/collectionsSlice';
import { collectionsApi } from '../../services/api';
import { toast } from 'react-toastify';

const CollectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedCollection: collection, isLoading } = useSelector(
    (state: RootState) => state.collections
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  const canEdit = user && collection && (user.role === 'ADMIN' || collection.creatorId === user.id);

  useEffect(() => {
    if (id) {
      dispatch(fetchCollection(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || '',
        isPublic: collection.isPublic,
      });
    }
  }, [collection]);

  const handleSave = async () => {
    if (!id) return;

    try {
      await dispatch(updateCollection({ id, data: formData })).unwrap();
      toast.success('Collection updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update collection');
    }
  };

  const handleRemoveAsset = async (assetId: string) => {
    if (!id) return;

    try {
      await dispatch(removeAssetFromCollection({ collectionId: id, assetId })).unwrap();
      toast.success('Asset removed from collection');
      dispatch(fetchCollection(id)); // Refresh collection data
    } catch (error) {
      toast.error('Failed to remove asset');
    }
  };

  const handleDownloadCollection = async () => {
    if (!id) return;

    try {
      toast.info('Preparing download...');
      const response = await collectionsApi.downloadCollection(id);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${collection?.name || 'collection'}-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download collection');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading collection...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Collection not found</p>
        <Link to="/collections" className="text-primary-600 hover:underline mt-4 inline-block">
          Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/collections"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
            <p className="text-gray-600 mt-1">
              {collection.assets?.length || 0} assets • Created by {collection.creator?.name || 'Unknown'}
            </p>
          </div>
          {collection.isPublic && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Public
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCollection}
            className="btn bg-green-600 text-white hover:bg-green-700"
            disabled={!collection.assets || collection.assets.length === 0}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </button>
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-primary">
              Edit
            </button>
          )}
          {canEdit && isEditing && (
            <>
              <button onClick={handleSave} className="btn-primary">
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className="btn">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collection Details */}
      {isEditing ? (
        <div className="card p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Make this collection public</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        collection.description && (
          <div className="card p-6 mb-6">
            <p className="text-gray-700">{collection.description}</p>
          </div>
        )
      )}

      {/* Assets in Collection */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Assets</h2>
          {canEdit && (
            <button
              onClick={() => setShowAddAssetModal(true)}
              className="btn-primary"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Assets
            </button>
          )}
        </div>

        {!collection.assets || collection.assets.length === 0 ? (
          <div className="text-center py-12">
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
            <p className="text-gray-600 mb-4">No assets in this collection yet</p>
            {canEdit && (
              <button onClick={() => setShowAddAssetModal(true)} className="btn-primary">
                Add Your First Asset
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {collection.assets.map((asset) => (
              <div key={asset.id} className="relative group">
                <Link
                  to={`/assets/${asset.id}`}
                  className="block card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={asset.thumbnailUrl || '/placeholder-image.png'}
                      alt={asset.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 truncate text-sm">{asset.title}</h3>
                  </div>
                </Link>
                {canEdit && (
                  <button
                    onClick={() => handleRemoveAsset(asset.id)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add Assets to Collection</h2>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                This feature requires browsing and selecting assets from your library. Navigate to the Assets page to browse and add assets to this collection.
              </p>
              <div className="flex space-x-3">
                <Link
                  to="/assets"
                  className="btn-primary"
                  onClick={() => setShowAddAssetModal(false)}
                >
                  Go to Assets
                </Link>
                <button onClick={() => setShowAddAssetModal(false)} className="btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage;
