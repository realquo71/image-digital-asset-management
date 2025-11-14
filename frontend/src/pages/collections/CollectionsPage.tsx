import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchCollections, createCollection, deleteCollection } from '../../store/slices/collectionsSlice';
import { toast } from 'react-toastify';

const CollectionsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: collections, isLoading, pagination } = useSelector(
    (state: RootState) => state.collections
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  const canCreate = user && (user.role === 'ADMIN' || user.role === 'CURATOR' || user.role === 'RESEARCHER');

  useEffect(() => {
    dispatch(fetchCollections({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    try {
      await dispatch(createCollection(formData)).unwrap();
      toast.success('Collection created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isPublic: false });
    } catch (error) {
      toast.error('Failed to create collection');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dispatch(deleteCollection(id)).unwrap();
      toast.success('Collection deleted successfully');
    } catch (error) {
      toast.error('Failed to delete collection');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} total collections
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Collection
          </button>
        )}
      </div>

      {/* Collections Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-600 mb-4">Create collections to organize your assets</p>
          {canCreate && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Your First Collection
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="card overflow-hidden hover:shadow-md transition-shadow">
              <Link to={`/collections/${collection.id}`} className="block p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{collection.name}</h3>
                  {collection.isPublic && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Public
                    </span>
                  )}
                </div>

                {collection.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{collection.assetCount || 0} assets</span>
                  <span>By {collection.creator?.name || 'Unknown'}</span>
                </div>
              </Link>

              {/* Actions */}
              {user && (user.role === 'ADMIN' || collection.creatorId === user.id) && (
                <div className="flex items-center justify-end space-x-2 px-6 pb-4">
                  <Link
                    to={`/collections/${collection.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(collection.id, collection.name)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">New Collection</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Make this collection public</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Public collections can be viewed by all users
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
