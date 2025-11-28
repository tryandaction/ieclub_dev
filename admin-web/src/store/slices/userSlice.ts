// 用户状态管理
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '@/api/user';
import type { User, UserDetail } from '@/types/user';
import type { PaginationResponse } from '@/types/common';

interface UserState {
  list: User[];
  users?: User[]; // 别名
  currentUser: UserDetail | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number; // total 别名
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  list: [],
  currentUser: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

// 异步Actions
export const fetchUsers = createAsyncThunk(
  'user/fetchList',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await userApi.list(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取用户列表失败');
    }
  }
);

export const fetchUserDetail = createAsyncThunk(
  'user/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await userApi.get(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取用户详情失败');
    }
  }
);

// 用户操作相关的异步thunks
export const banUser = createAsyncThunk(
  'user/ban',
  async ({ id, data }: { id: number | string; data: { duration: number; reason: string } }, { rejectWithValue }) => {
    try {
      await userApi.ban(String(id), { ...data, notifyUser: true });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '封禁用户失败');
    }
  }
);

export const unbanUser = createAsyncThunk(
  'user/unban',
  async (id: number | string, { rejectWithValue }) => {
    try {
      await userApi.unban(String(id), { reason: '解除封禁' });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '解封用户失败');
    }
  }
);

export const warnUser = createAsyncThunk(
  'user/warn',
  async ({ id, data }: { id: number | string; data: { level: number; reason: string } }, { rejectWithValue }) => {
    try {
      // 转换数字级别为字符串
      const levelMap: Record<number, 'minor' | 'serious' | 'final'> = {
        1: 'minor',
        2: 'serious', 
        3: 'final'
      };
      await userApi.warn(String(id), { 
        reason: data.reason,
        content: data.reason,
        level: levelMap[data.level] || 'minor'
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '警告用户失败');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'user/delete',
  async (id: number | string, { rejectWithValue }) => {
    try {
      await userApi.delete(String(id));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除用户失败');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<UserDetail | null>) => {
      state.currentUser = action.payload;
    },
    updateUserInList: (state, action: PayloadAction<User>) => {
      const index = state.list.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch List
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action: PayloadAction<PaginationResponse<User>>) => {
      state.loading = false;
      state.list = action.payload.list;
      state.users = action.payload.list; // 同步别名
      state.pagination = action.payload.pagination;
      state.total = action.payload.pagination.total; // 同步total
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Detail
    builder.addCase(fetchUserDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUserDetail.fulfilled, (state, action: PayloadAction<UserDetail>) => {
      state.loading = false;
      state.currentUser = action.payload;
    });
    builder.addCase(fetchUserDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setCurrentUser, updateUserInList } = userSlice.actions;
export default userSlice.reducer;

