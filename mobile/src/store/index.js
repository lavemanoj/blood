import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import requestReducer from './requestSlice';

export const store = configureStore({
  reducer: { auth: authReducer, requests: requestReducer }
});
