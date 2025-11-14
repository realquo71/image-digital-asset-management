import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { collectionsApi } from '../../services/api';
import { Collection } from '../../types';

interface CollectionsState {
  items: Collection[];
  selectedCollection: Collection | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: CollectionsState = {
  items: [],
  selectedCollection: null,
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
export const fetchCollections = createAsyncThunk(
  'collections/fetchCollections',
  async (params?: { page?: number; limit?: number }) => {
    const response = await collectionsApi.getCollections(params?.page, params?.limit);
    return {
      items: response.data.data,
      meta: response.data.meta,
    };
  }
);

export const fetchCollection = createAsyncThunk(
  'collections/fetchCollection',
  async (id: string) => {
    const response = await collectionsApi.getCollection(id);
    return response.data.data;
  }
);

export const createCollection = createAsyncThunk(
  'collections/createCollection',
  async (data: { name: string; description?: string; isPublic?: boolean }) => {
    const response = await collectionsApi.createCollection(data);
    return response.data.data;
  }
);

export const updateCollection = createAsyncThunk(
  'collections/updateCollection',
  async ({
    id,
    data,
  }: {
    id: string;
    data: { name?: string; description?: string; isPublic?: boolean };
  }) => {
    const response = await collectionsApi.updateCollection(id, data);
    return response.data.data;
  }
);

export const deleteCollection = createAsyncThunk(
  'collections/deleteCollection',
  async (id: string) => {
    await collectionsApi.deleteCollection(id);
    return id;
  }
);

export const addAssetToCollection = createAsyncThunk(
  'collections/addAsset',
  async ({ collectionId, assetId }: { collectionId: string; assetId: string }) => {
    await collectionsApi.addAssetToCollection(collectionId, assetId);
    return { collectionId, assetId };
  }
);

export const removeAssetFromCollection = createAsyncThunk(
  'collections/removeAsset',
  async ({ collectionId, assetId }: { collectionId: string; assetId: string }) => {
    await collectionsApi.removeAssetFromCollection(collectionId, assetId);
    return { collectionId, assetId };
  }
);

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    setSelectedCollection: (state, action: PayloadAction<Collection | null>) => {
      state.selectedCollection = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch collections
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
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
      .addCase(fetchCollections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch collections';
      });

    // Fetch single collection
    builder
      .addCase(fetchCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCollection = action.payload;
      })
      .addCase(fetchCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch collection';
      });

    // Create collection
    builder
      .addCase(createCollection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCollection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createCollection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create collection';
      });

    // Update collection
    builder.addCase(updateCollection.fulfilled, (state, action) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedCollection?.id === action.payload.id) {
        state.selectedCollection = action.payload;
      }
    });

    // Delete collection
    builder.addCase(deleteCollection.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      if (state.selectedCollection?.id === action.payload) {
        state.selectedCollection = null;
      }
    });
  },
});

export const { setSelectedCollection } = collectionsSlice.actions;
export default collectionsSlice.reducer;
