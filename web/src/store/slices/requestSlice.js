import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchRequests = createAsyncThunk('requests/fetchAll', async () => {
  const { data } = await api.get('/requests');
  return data;
});

export const createRequest = createAsyncThunk('requests/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/requests', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const acceptRequest = createAsyncThunk('requests/accept', async (id) => {
  const { data } = await api.put(`/requests/${id}/accept`);
  return { id, ...data };
});

const requestSlice = createSlice({
  name: 'requests',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => { state.loading = true; })
      .addCase(fetchRequests.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchRequests.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(createRequest.fulfilled, (state, action) => { state.list.unshift(action.payload); });
  }
});

export default requestSlice.reducer;
