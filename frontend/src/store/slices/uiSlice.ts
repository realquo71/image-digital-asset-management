import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  selectedAssets: string[]; // For bulk operations
  viewMode: 'grid' | 'list';
  loading: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  selectedAssets: [],
  viewMode: 'grid',
  loading: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleAssetSelection: (state, action: PayloadAction<string>) => {
      const assetId = action.payload;
      const index = state.selectedAssets.indexOf(assetId);
      if (index > -1) {
        state.selectedAssets.splice(index, 1);
      } else {
        state.selectedAssets.push(assetId);
      }
    },
    selectAllAssets: (state, action: PayloadAction<string[]>) => {
      state.selectedAssets = action.payload;
    },
    clearAssetSelection: (state) => {
      state.selectedAssets = [];
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
      localStorage.setItem('viewMode', action.payload);
    },
    setLoading: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleAssetSelection,
  selectAllAssets,
  clearAssetSelection,
  setViewMode,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
