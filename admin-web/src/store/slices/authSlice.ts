// 认证状态管理
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminAuthApi } from '@/api/admin';
import type { Admin, LoginRequest } from '@/types/admin';

interface AuthState {
  admin: Admin | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  admin: null,
  token: localStorage.getItem('admin_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('admin_token'),
  loading: false,
  error: null,
};

// 异步Actions
export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await adminAuthApi.login(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '登录失败');
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAuthApi.getMe();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取信息失败');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await adminAuthApi.logout();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '登出失败');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ admin: Admin; token: string; refreshToken: string }>) => {
      state.admin = action.payload.admin;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('admin_token', action.payload.token);
      localStorage.setItem('refresh_token', action.payload.refreshToken);
    },
    clearAuth: (state) => {
      state.admin = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('refresh_token');
    },
    updateAdmin: (state, action: PayloadAction<Partial<Admin>>) => {
      if (state.admin) {
        state.admin = { ...state.admin, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.admin = action.payload.admin;
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('admin_token', action.payload.accessToken);
      localStorage.setItem('refresh_token', action.payload.refreshToken);
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get Me
    builder.addCase(getMe.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.loading = false;
      state.admin = action.payload;
    });
    builder.addCase(getMe.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.admin = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('refresh_token');
    });
  },
});

export const { setAuth, clearAuth, updateAdmin } = authSlice.actions;
export default authSlice.reducer;

