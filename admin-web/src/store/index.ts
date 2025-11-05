// Redux Store配置
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import announcementReducer from './slices/announcementSlice';
import userReducer from './slices/userSlice';
import reportReducer from './slices/reportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    announcement: announcementReducer,
    user: userReducer,
    report: reportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

