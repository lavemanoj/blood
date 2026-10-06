import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds);
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('role', data.user.role);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null },
  reducers: {
    logout: async (state) => {
      await AsyncStorage.removeItem('token');
      state.user = null; state.token = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
