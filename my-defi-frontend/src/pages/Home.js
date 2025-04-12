import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { connectWallet, disconnectWallet } from '../store/walletSlice';
import { blockchainService } from '../services/blockchainService';

const Home = () => {
  const dispatch = useDispatch();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const { account } = useSelector((state) => state.wallet);

  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const currentAccount = await blockchainService.getAccount();
        if (currentAccount) {
          dispatch(connectWallet({
            account: currentAccount,
            network: await blockchainService.getNetwork()
          }));
        }
      } catch (err) {
        console.error('检查钱包连接失败:', err);
      }
    };

    checkWalletConnection();
  }, [dispatch]);

  const handleWalletAction = async () => {
    if (account) {
      // 如果已连接，执行断开连接
      dispatch(disconnectWallet());
    } else {
      // 如果未连接，执行连接
      try {
        setIsConnecting(true);
        setError('');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          dispatch(connectWallet({
            account: accounts[0],
            network: await blockchainService.getNetwork()
          }));
        }
      } catch (err) {
        console.error('连接钱包失败:', err);
        setError('连接失败: ' + err.message);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          欢迎来到 DeFi 交易平台
        </Typography>

        <Box sx={{ mt: 4, mb: 4 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            color={account ? "error" : "primary"}
            size="large"
            onClick={handleWalletAction}
            disabled={isConnecting}
            sx={{
              minWidth: 200,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            {isConnecting ? '连接中...' : account ? '断开连接' : '连接钱包'}
          </Button>
        </Box>

        {account && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" color="text.secondary">
              已连接钱包: {`${account.slice(0, 6)}...${account.slice(-4)}`}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Home; 