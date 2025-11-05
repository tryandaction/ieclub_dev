// 公告状态管理
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { announcementApi } from '@/api/announcement';
import type { Announcement } from '@/types/announcement';
import type { PaginationResponse } from '@/types/common';

interface AnnouncementState {
  list: Announcement[];
  currentAnnouncement: Announcement | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AnnouncementState = {
  list: [],
  currentAnnouncement: null,
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
export const fetchAnnouncements = createAsyncThunk(
  'announcement/fetchList',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await announcementApi.list(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取公告列表失败');
    }
  }
);

export const fetchAnnouncementDetail = createAsyncThunk(
  'announcement/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await announcementApi.get(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取公告详情失败');
    }
  }
);

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {
    setCurrentAnnouncement: (state, action: PayloadAction<Announcement | null>) => {
      state.currentAnnouncement = action.payload;
    },
    updateAnnouncementInList: (state, action: PayloadAction<Announcement>) => {
      const index = state.list.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    removeAnnouncementFromList: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((item) => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch List
    builder.addCase(fetchAnnouncements.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAnnouncements.fulfilled, (state, action: PayloadAction<PaginationResponse<Announcement>>) => {
      state.loading = false;
      state.list = action.payload.list;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchAnnouncements.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Detail
    builder.addCase(fetchAnnouncementDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAnnouncementDetail.fulfilled, (state, action: PayloadAction<Announcement>) => {
      state.loading = false;
      state.currentAnnouncement = action.payload;
    });
    builder.addCase(fetchAnnouncementDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setCurrentAnnouncement, updateAnnouncementInList, removeAnnouncementFromList } = announcementSlice.actions;
export default announcementSlice.reducer;

