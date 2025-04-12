// src/store/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  account: null,
  network: null,
  balance: 0,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state, action) => {
      state.isConnected = true;
      state.account = action.payload.account;
      state.network = action.payload.network;
    },
    disconnectWallet: (state) => {
      state.isConnected = false;
      state.account = null;
      state.network = null;
      state.balance = 0;
    },
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { connectWallet, disconnectWallet, updateBalance, setError } = walletSlice.actions;
export default walletSlice.reducer;