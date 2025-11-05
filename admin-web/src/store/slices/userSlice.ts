// 用户状态管理
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '@/api/user';
import type { User, UserDetail } from '@/types/user';
import type { PaginationResponse } from '@/types/common';

interface UserState {
  list: User[];
  currentUser: UserDetail | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
      state.pagination = action.payload.pagination;
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

