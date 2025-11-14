import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import assetsReducer from './slices/assetsSlice';
import collectionsReducer from './slices/collectionsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetsReducer,
    collections: collectionsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['assets/uploadAsset/pending'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['assets.uploadQueue'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
