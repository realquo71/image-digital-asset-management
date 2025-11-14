import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAsset, updateAsset, deleteAsset } from '../../store/slices/assetsSlice';
import { assetsApi, tagsApi, arcoApi } from '../../services/api';
import { AssetStatus, ArcoCategory } from '../../types';
import { toast } from 'react-toastify';
import ArcoTagSelector from '../../components/assets/ArcoTagSelector';

const AssetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedAsset: asset, isLoading } = useSelector((state: RootState) => state.assets);
  const { user } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: AssetStatus.DRAFT,
  });
  const [newTag, setNewTag] = useState('');
  const [showArcoSelector, setShowArcoSelector] = useState(false);

  const canEdit = user && (user.role === 'ADMIN' || (user.role === 'CURATOR' && asset?.creatorId === user.id));

  useEffect(() => {
    if (id) {
      dispatch(fetchAsset(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (asset) {
      setFormData({
        title: asset.title,
        description: asset.description || '',
        status: asset.status,
      });
    }
  }, [asset]);

  const handleSave = async () => {
    if (!id) return;

    try {
      await dispatch(updateAsset({ id, data: formData })).unwrap();
      toast.success('Asset updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update asset');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    try {
      await dispatch(deleteAsset(id)).unwrap();
      toast.success('Asset deleted successfully');
      navigate('/assets');
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const handleAddTag = async () => {
    if (!id || !newTag.trim()) return;

    try {
      await tagsApi.addTagToAsset(id, newTag.trim());
      toast.success('Tag added');
      setNewTag('');
      dispatch(fetchAsset(id)); // Refresh asset data
    } catch (error) {
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!id) return;

    try {
      await tagsApi.removeTagFromAsset(id, tagId);
      toast.success('Tag removed');
      dispatch(fetchAsset(id));
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  const handleAddArcoTag = async (arcoUri: string, category: ArcoCategory, label: string) => {
    if (!id) return;

    try {
      await arcoApi.addArcoTagToAsset(id, arcoUri, category, label);
      toast.success('ArCo tag added');
      setShowArcoSelector(false);
      dispatch(fetchAsset(id));
    } catch (error) {
      toast.error('Failed to add ArCo tag');
    }
  };

  const handleRemoveArcoTag = async (arcoUri: string) => {
    if (!id) return;

    try {
      await arcoApi.removeArcoTagFromAsset(id, arcoUri);
      toast.success('ArCo tag removed');
      dispatch(fetchAsset(id));
    } catch (error) {
      toast.error('Failed to remove ArCo tag');
    }
  };

  const handleDownload = async () => {
    if (!id) return;

    try {
      const response = await assetsApi.downloadAsset(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', asset?.filename || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download asset');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading asset...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Asset not found</p>
        <Link to="/assets" className="text-primary-600 hover:underline mt-4 inline-block">
          Back to Assets
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
            to="/assets"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{asset.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            asset.status === AssetStatus.PUBLISHED
              ? 'bg-green-100 text-green-800'
              : asset.status === AssetStatus.DRAFT
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {asset.status}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handleDownload} className="btn bg-green-600 text-white hover:bg-green-700">
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
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
          {canEdit && (
            <button onClick={handleDelete} className="btn bg-red-600 text-white hover:bg-red-700">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Image */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <img
              src={asset.sharepointUrl}
              alt={asset.title}
              className="w-full h-auto rounded-lg"
            />
          </div>

          {/* Metadata */}
          <div className="card p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Details</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                    className="input"
                  >
                    <option value={AssetStatus.DRAFT}>Draft</option>
                    <option value={AssetStatus.PUBLISHED}>Published</option>
                    <option value={AssetStatus.ARCHIVED}>Archived</option>
                  </select>
                </div>
              </div>
            ) : (
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-gray-900">{asset.description || 'No description'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Filename</dt>
                  <dd className="mt-1 text-gray-900">{asset.filename}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">File Size</dt>
                  <dd className="mt-1 text-gray-900">{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-gray-900">{asset.mimeType}</dd>
                </div>
                {asset.width && asset.height && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                    <dd className="mt-1 text-gray-900">{asset.width} × {asset.height} px</dd>
                  </div>
                )}
                {asset.camera && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Camera</dt>
                    <dd className="mt-1 text-gray-900">{asset.camera}</dd>
                  </div>
                )}
                {asset.captureDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Capture Date</dt>
                    <dd className="mt-1 text-gray-900">{new Date(asset.captureDate).toLocaleDateString()}</dd>
                  </div>
                )}
                {asset.gpsLatitude && asset.gpsLongitude && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">GPS Coordinates</dt>
                    <dd className="mt-1 text-gray-900">
                      {asset.gpsLatitude.toFixed(6)}, {asset.gpsLongitude.toFixed(6)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Uploaded By</dt>
                  <dd className="mt-1 text-gray-900">{asset.creator?.name || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Uploaded At</dt>
                  <dd className="mt-1 text-gray-900">{new Date(asset.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {/* Sidebar - Tags */}
        <div className="space-y-6">
          {/* Regular Tags */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {asset.tags?.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {tag.name}
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-2 text-gray-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {canEdit && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  className="input flex-1"
                />
                <button onClick={handleAddTag} className="btn-primary">
                  Add
                </button>
              </div>
            )}
          </div>

          {/* ArCo Tags */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ArCo Tags</h2>
            <div className="space-y-3 mb-4">
              {asset.arcoTags?.map((tag) => (
                <div key={tag.arcoUri} className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tag.label}</div>
                    <div className="text-xs text-gray-500">{tag.category.replace(/_/g, ' ')}</div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveArcoTag(tag.arcoUri)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <button
                onClick={() => setShowArcoSelector(true)}
                className="btn-primary w-full"
              >
                Add ArCo Tag
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ArCo Tag Selector Modal */}
      {showArcoSelector && (
        <ArcoTagSelector
          onSelect={handleAddArcoTag}
          onClose={() => setShowArcoSelector(false)}
        />
      )}
    </div>
  );
};

export default AssetDetailPage;
