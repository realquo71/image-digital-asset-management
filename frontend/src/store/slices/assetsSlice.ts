import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { assetsApi } from '../../services/api';
import { Asset, UploadProgress } from '../../types';

interface AssetsState {
  items: Asset[];
  selectedAsset: Asset | null;
  uploadQueue: UploadProgress[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: AssetsState = {
  items: [],
  selectedAsset: null,
  uploadQueue: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// Async thunks
export const fetchAssets = createAsyncThunk(
  'assets/fetchAssets',
  async (params?: { page?: number; limit?: number; status?: string; creatorId?: string }) => {
    const response = await assetsApi.getAssets(params);
    return {
      items: response.data.data,
      meta: response.data.meta,
    };
  }
);

export const fetchAsset = createAsyncThunk('assets/fetchAsset', async (id: string) => {
  const response = await assetsApi.getAsset(id);
  return response.data.data;
});

export const uploadAsset = createAsyncThunk(
  'assets/uploadAsset',
  async (
    {
      file,
      metadata,
    }: {
      file: File;
      metadata: { title: string; description?: string; status?: string };
    },
    { dispatch }
  ) => {
    // Add to upload queue
    const uploadProgress: UploadProgress = {
      filename: file.name,
      progress: 0,
      status: 'pending',
    };
    dispatch(addToUploadQueue(uploadProgress));

    try {
      // Update status to uploading
      dispatch(
        updateUploadProgress({
          filename: file.name,
          progress: 0,
          status: 'uploading',
        })
      );

      const response = await assetsApi.uploadAsset(file, metadata, (progress) => {
        dispatch(
          updateUploadProgress({
            filename: file.name,
            progress,
            status: 'uploading',
          })
        );
      });

      // Update to processing
      dispatch(
        updateUploadProgress({
          filename: file.name,
          progress: 100,
          status: 'processing',
        })
      );

      // Mark as completed
      dispatch(
        updateUploadProgress({
          filename: file.name,
          progress: 100,
          status: 'completed',
          assetId: response.data.data.id,
        })
      );

      return response.data.data;
    } catch (error: any) {
      dispatch(
        updateUploadProgress({
          filename: file.name,
          progress: 0,
          status: 'error',
          error: error.message,
        })
      );
      throw error;
    }
  }
);

export const updateAsset = createAsyncThunk(
  'assets/updateAsset',
  async ({
    id,
    data,
  }: {
    id: string;
    data: { title?: string; description?: string; status?: string };
  }) => {
    const response = await assetsApi.updateAsset(id, data);
    return response.data.data;
  }
);

export const deleteAsset = createAsyncThunk('assets/deleteAsset', async (id: string) => {
  await assetsApi.deleteAsset(id);
  return id;
});

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setSelectedAsset: (state, action: PayloadAction<Asset | null>) => {
      state.selectedAsset = action.payload;
    },
    addToUploadQueue: (state, action: PayloadAction<UploadProgress>) => {
      state.uploadQueue.push(action.payload);
    },
    updateUploadProgress: (state, action: PayloadAction<UploadProgress>) => {
      const index = state.uploadQueue.findIndex(
        (item) => item.filename === action.payload.filename
      );
      if (index !== -1) {
        state.uploadQueue[index] = { ...state.uploadQueue[index], ...action.payload };
      }
    },
    removeFromUploadQueue: (state, action: PayloadAction<string>) => {
      state.uploadQueue = state.uploadQueue.filter((item) => item.filename !== action.payload);
    },
    clearUploadQueue: (state) => {
      state.uploadQueue = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch assets
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        if (action.payload.meta) {
          state.pagination = {
            page: action.payload.meta.page || 1,
            limit: action.payload.meta.limit || 20,
            total: action.payload.meta.total || 0,
            pages: action.payload.meta.pages || 0,
          };
        }
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch assets';
      });

    // Fetch single asset
    builder
      .addCase(fetchAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedAsset = action.payload;
      })
      .addCase(fetchAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch asset';
      });

    // Upload asset
    builder
      .addCase(uploadAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload); // Add to beginning of list
      })
      .addCase(uploadAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload asset';
      });

    // Update asset
    builder
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedAsset?.id === action.payload.id) {
          state.selectedAsset = action.payload;
        }
      });

    // Delete asset
    builder.addCase(deleteAsset.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      if (state.selectedAsset?.id === action.payload) {
        state.selectedAsset = null;
      }
    });
  },
});

export const {
  setSelectedAsset,
  addToUploadQueue,
  updateUploadProgress,
  removeFromUploadQueue,
  clearUploadQueue,
} = assetsSlice.actions;

export default assetsSlice.reducer;
