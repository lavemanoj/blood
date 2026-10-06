import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchRequests = createAsyncThunk('requests/fetch', async () => {
  const { data } = await api.get('/requests');
  return data;
});

export const acceptRequest = createAsyncThunk('requests/accept', async (id) => {
  await api.put(`/requests/${id}/accept`);
  return id;
});

const requestSlice = createSlice({
  name: 'requests',
  initialState: { list: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => { state.loading = true; })
      .addCase(fetchRequests.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(acceptRequest.fulfilled, (state, action) => {
        state.list = state.list.map(r => r._id === action.payload ? { ...r, status: 'accepted' } : r);
      });
  }
});

export default requestSlice.reducer;
