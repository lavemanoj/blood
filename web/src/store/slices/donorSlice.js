import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchDonorProfile = createAsyncThunk('donor/profile', async () => {
  const { data } = await api.get('/donors/profile');
  return data;
});

export const toggleAvailability = createAsyncThunk('donor/toggleAvailability', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/donors/availability');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update availability');
  }
});

const donorSlice = createSlice({
  name: 'donor',
  initialState: { profile: null, loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDonorProfile.fulfilled, (state, action) => { state.profile = action.payload; })
      .addCase(toggleAvailability.fulfilled, (state, action) => {
        if (state.profile) state.profile.isAvailable = action.payload.isAvailable;
      });
  }
});

export default donorSlice.reducer;
