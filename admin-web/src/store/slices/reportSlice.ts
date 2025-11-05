// 举报状态管理
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { reportApi } from '@/api/report';
import type { Report } from '@/types/common';
import type { PaginationResponse } from '@/types/common';

interface ReportState {
  list: Report[];
  reports?: Report[]; // 别名
  currentReport: Report | null;
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

const initialState: ReportState = {
  list: [],
  currentReport: null,
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
export const fetchReports = createAsyncThunk(
  'report/fetchList',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await reportApi.list(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取举报列表失败');
    }
  }
);

export const fetchReportDetail = createAsyncThunk(
  'report/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await reportApi.get(String(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取举报详情失败');
    }
  }
);

export const handleReport = createAsyncThunk(
  'report/handle',
  async ({ id, data }: { id: number | string; data: any }, { rejectWithValue }) => {
    try {
      const response = await reportApi.handleReport(String(id), data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '处理举报失败');
    }
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setCurrentReport: (state, action: PayloadAction<Report | null>) => {
      state.currentReport = action.payload;
    },
    updateReportInList: (state, action: PayloadAction<Report>) => {
      const index = state.list.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch List
    builder.addCase(fetchReports.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReports.fulfilled, (state, action: PayloadAction<PaginationResponse<Report>>) => {
      state.loading = false;
      state.list = action.payload.list;
      state.reports = action.payload.list; // 同步别名
      state.pagination = action.payload.pagination;
      state.total = action.payload.pagination.total; // 同步total
    });
    builder.addCase(fetchReports.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Detail
    builder.addCase(fetchReportDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchReportDetail.fulfilled, (state, action: PayloadAction<Report>) => {
      state.loading = false;
      state.currentReport = action.payload;
    });
    builder.addCase(fetchReportDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setCurrentReport, updateReportInList } = reportSlice.actions;
export default reportSlice.reducer;

