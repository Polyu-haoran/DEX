import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './walletSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
  },
});
