import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchFeed = createAsyncThunk('content/fetchFeed', async ({ page = 1 } = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/content?page=${page}&limit=20`);
    return { ...data, page };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to load feed');
  }
});

export const fetchArticle = createAsyncThunk('content/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/content/${id}`);
    return data.content;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to load article');
  }
});

export const saveContent = createAsyncThunk('content/save', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/content/${id}/save`);
    return { id, saved: data.saved };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error);
  }
});

const contentSlice = createSlice({
  name: 'content',
  initialState: {
    feed: [],
    currentArticle: null,
    pagination: null,
    isLoading: false,
    isLoadingMore: false,
    error: null,
  },
  reducers: {
    clearCurrentArticle: (state) => { state.currentArticle = null; },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFeed.pending, (state, action) => {
      const page = action.meta.arg?.page || 1;
      if (page === 1) state.isLoading = true;
      else state.isLoadingMore = true;
    });
    builder.addCase(fetchFeed.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      if (action.payload.page === 1) state.feed = action.payload.items;
      else state.feed = [...state.feed, ...action.payload.items];
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchFeed.rejected, (state, action) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      state.error = action.payload;
    });
    builder.addCase(fetchArticle.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchArticle.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentArticle = action.payload;
    });
    builder.addCase(fetchArticle.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const { clearCurrentArticle } = contentSlice.actions;
export default contentSlice.reducer;
