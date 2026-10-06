import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import requestReducer from './slices/requestSlice';
import donorReducer from './slices/donorSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    requests: requestReducer,
    donor: donorReducer
  }
});
