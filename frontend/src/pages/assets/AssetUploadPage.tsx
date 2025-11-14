import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { AppDispatch, RootState } from '../../store';
import { uploadAsset, clearUploadQueue } from '../../store/slices/assetsSlice';
import { AssetStatus } from '../../types';
import { toast } from 'react-toastify';

const AssetUploadPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { uploadQueue } = useSelector((state: RootState) => state.assets);

  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<{[key: string]: {title: string; description: string; status: AssetStatus}}>({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);

      // Initialize metadata for new files
      const newMetadata = { ...metadata };
      acceptedFiles.forEach(file => {
        if (!newMetadata[file.name]) {
          newMetadata[file.name] = {
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            description: '',
            status: AssetStatus.DRAFT,
          };
        }
      });
      setMetadata(newMetadata);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    const removedFile = newFiles.splice(index, 1)[0];
    setFiles(newFiles);

    const newMetadata = { ...metadata };
    delete newMetadata[removedFile.name];
    setMetadata(newMetadata);
  };

  const handleMetadataChange = (fileName: string, field: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [field]: value,
      },
    }));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.warning('Please select files to upload');
      return;
    }

    // Validate metadata
    for (const file of files) {
      if (!metadata[file.name]?.title) {
        toast.error(`Please provide a title for ${file.name}`);
        return;
      }
    }

    // Upload files one by one
    for (const file of files) {
      try {
        await dispatch(uploadAsset({
          file,
          metadata: metadata[file.name],
        })).unwrap();

        toast.success(`${file.name} uploaded successfully`);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    // Clear files after successful upload
    setFiles([]);
    setMetadata({});

    // Redirect to assets page
    setTimeout(() => {
      navigate('/assets');
    }, 2000);
  };

  const handleCancel = () => {
    if (uploadQueue.some(item => item.status === 'uploading')) {
      if (!confirm('Upload in progress. Are you sure you want to cancel?')) {
        return;
      }
    }

    setFiles([]);
    setMetadata({});
    dispatch(clearUploadQueue());
    navigate('/assets');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Upload Assets</h1>
        <p className="text-gray-600 mt-1">
          Upload images and documents to your digital asset library
        </p>
      </div>

      {/* Dropzone */}
      <div className="card p-6 mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-600 bg-primary-50'
              : 'border-gray-300 hover:border-primary-500'
          }`}
        >
          <input {...getInputProps()} />
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isDragActive ? (
            <p className="text-lg font-medium text-primary-600">Drop files here...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: JPG, PNG, GIF, TIFF, PDF (Max 100MB per file)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload Queue Status */}
      {uploadQueue.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Progress</h2>
          <div className="space-y-3">
            {uploadQueue.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{item.filename}</span>
                    <span className={`text-sm ${
                      item.status === 'completed' ? 'text-green-600' :
                      item.status === 'error' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {item.status === 'completed' ? 'Complete' :
                       item.status === 'error' ? 'Failed' :
                       item.status === 'processing' ? 'Processing...' :
                       `${item.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.status === 'completed' ? 'bg-green-600' :
                        item.status === 'error' ? 'bg-red-600' :
                        'bg-primary-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {item.error && (
                    <p className="text-sm text-red-600 mt-1">{item.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List with Metadata */}
      {files.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Files to Upload ({files.length})
          </h2>
          <div className="space-y-4">
            {files.map((file, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={metadata[file.name]?.title || ''}
                      onChange={(e) => handleMetadataChange(file.name, 'title', e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={metadata[file.name]?.status || AssetStatus.DRAFT}
                      onChange={(e) => handleMetadataChange(file.name, 'status', e.target.value)}
                      className="input"
                    >
                      <option value={AssetStatus.DRAFT}>Draft</option>
                      <option value={AssetStatus.PUBLISHED}>Published</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={metadata[file.name]?.description || ''}
                      onChange={(e) => handleMetadataChange(file.name, 'description', e.target.value)}
                      className="input"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        <button onClick={handleCancel} className="btn">
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploadQueue.some(item => item.status === 'uploading')}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadQueue.some(item => item.status === 'uploading')
            ? 'Uploading...'
            : `Upload ${files.length} ${files.length === 1 ? 'File' : 'Files'}`}
        </button>
      </div>
    </div>
  );
};

export default AssetUploadPage;
