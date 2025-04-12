//检查用户是否已安装 MetaMask 钱包
//提供连接钱包的按钮
//显示当前连接的钱包地址（如果已连接）
//监听钱包账户的变化
//显示连接状态和错误信息
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectWallet, disconnectWallet, updateBalance } from '../store/walletSlice';
import { blockchainService } from '../services/blockchainService';
import { Button, Typography, Box } from '@mui/material';

const WalletConnect = () => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // 从 Redux store 中获取状态
  const { account, balance } = useSelector((state) => state.wallet);

  useEffect(() => {
    const init = async () => {
      try {
        const initialized = await blockchainService.init();
        setIsInitialized(initialized);

        if (initialized) {
          // 检查是否已经连接
          const currentAccount = await blockchainService.getAccount();
          if (currentAccount) {
            const balance = await blockchainService.getBalance(currentAccount);
            dispatch(connectWallet({
              account: currentAccount,
              network: await blockchainService.getNetwork()
            }));
            dispatch(updateBalance(balance));
          }

          // 监听账户变化
          blockchainService.onAccountsChanged(async (accounts) => {
            if (accounts.length > 0) {
              const balance = await blockchainService.getBalance(accounts[0]);
              dispatch(connectWallet({
                account: accounts[0],
                network: await blockchainService.getNetwork()
              }));
              dispatch(updateBalance(balance));
            } else {
              dispatch(disconnectWallet());
            }
          });

          // 监听网络变化
          blockchainService.onNetworkChanged(() => {
            window.location.reload();
          });
        }
      } catch (err) {
        console.error('初始化失败:', err);
        setError('初始化失败: ' + err.message);
      }
    };

    init();
  }, [dispatch]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError('');

      if (!isInitialized) {
        setError('请先安装 MetaMask 钱包');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const balance = await blockchainService.getBalance(accounts[0]);
        dispatch(connectWallet({
          account: accounts[0],
          network: await blockchainService.getNetwork()
        }));
        dispatch(updateBalance(balance));
      }
    } catch (err) {
      console.error('连接失败:', err);
      setError('连接失败: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await blockchainService.disconnect();
      dispatch(disconnectWallet());
    } catch (err) {
      console.error('断开连接失败:', err);
    }
  };

  // 如果已经连接，显示断开连接按钮
  if (account) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">
          {`${account.slice(0, 6)}...${account.slice(-4)}`}
        </Typography>
        <Typography variant="body2">
          {balance} ETH
        </Typography>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={handleDisconnect}
        >
          断开连接
        </Button>
      </Box>
    );
  }

  // 如果未连接，显示连接按钮
  return (
    <Box>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? '连接中...' : '连接钱包'}
      </Button>
    </Box>
  );
};

export default WalletConnect; 