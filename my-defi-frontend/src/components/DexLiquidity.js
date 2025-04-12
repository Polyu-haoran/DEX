/* global BigInt */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { ethers } from 'ethers';
import { tokenService } from '../services/tokenService';
import { dexService } from '../services/dexService';
import { useSelector } from 'react-redux';
import {
  TOKEN_A_ADDRESS,
  TOKEN_B_ADDRESS,
  TOKEN_C_ADDRESS
} from '../config/contracts';

const DexLiquidity = () => {
  const { account } = useSelector((state) => state.wallet);
  const [selectedPair, setSelectedPair] = useState('');
  const [tokenPairs, setTokenPairs] = useState([]);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenInfo, setTokenInfo] = useState([]);
  const [poolInfo, setPoolInfo] = useState(null);
  const [allPools, setAllPools] = useState([]);

  useEffect(() => {
    const loadTokenPairs = async () => {
      try {
        const pairs = [
          { label: 'TKA/TKB', tokenA: TOKEN_A_ADDRESS, tokenB: TOKEN_B_ADDRESS },
          { label: 'TKA/TKC', tokenA: TOKEN_A_ADDRESS, tokenB: TOKEN_C_ADDRESS },
          { label: 'TKB/TKC', tokenA: TOKEN_B_ADDRESS, tokenB: TOKEN_C_ADDRESS }
        ];
        setTokenPairs(pairs);
        if (pairs.length > 0) {
          setSelectedPair(pairs[0].label);
        }
      } catch (err) {
        console.error('加载代币对失败:', err);
        setError('加载代币对失败');
      }
    };

    const loadTokenInfo = async () => {
      try {
        const info = await tokenService.getAllTokenInfo();
        setTokenInfo(info);
      } catch (err) {
        console.error('加载代币信息失败:', err);
      }
    };

    loadTokenPairs();
    loadTokenInfo();
  }, []);

  useEffect(() => {
    const loadPoolInfo = async () => {
      if (!selectedPair) return;

      try {
        const pair = tokenPairs.find(p => p.label === selectedPair);
        if (!pair) return;

        const info = await dexService.getPairInfo(pair.tokenA, pair.tokenB);
        setPoolInfo(info);
      } catch (err) {
        console.error('加载池子信息失败:', err);
      }
    };

    loadPoolInfo();
  }, [selectedPair, tokenPairs]);

  useEffect(() => {
    const loadAllPools = async () => {
      try {
        const pools = await Promise.all(
          tokenPairs.map(async (pair) => {
            try {
              const info = await dexService.getPairInfo(pair.tokenA, pair.tokenB);
              return {
                ...pair,
                info
              };
            } catch (err) {
              console.error(`加载池子 ${pair.label} 信息失败:`, err);
              return null;
            }
          })
        );
        setAllPools(pools.filter(pool => pool !== null));
      } catch (err) {
        console.error('加载所有池子信息失败:', err);
      }
    };

    loadAllPools();
  }, [tokenPairs]);

  const handlePairChange = (event) => {
    setSelectedPair(event.target.value);
    setAmount0('');
    setAmount1('');
  };

  const handleAmount0Change = async (event) => {
    const value = event.target.value;
    setAmount0(value);

    if (!value || !poolInfo) return;

    try {
      const amount0In = ethers.parseEther(value);
      const ratio = Number(poolInfo.reserveB) / Number(poolInfo.reserveA);
      const amount1Out = (amount0In * BigInt(Math.floor(ratio * 1e18))) / BigInt(1e18);
      setAmount1(ethers.formatEther(amount1Out));
    } catch (err) {
      console.error('计算金额失败:', err);
    }
  };

  const handleAmount1Change = async (event) => {
    const value = event.target.value;
    setAmount1(value);

    if (!value || !poolInfo) return;

    try {
      const amount1In = ethers.parseEther(value);
      const ratio = Number(poolInfo.reserveA) / Number(poolInfo.reserveB);
      const amount0Out = (amount1In * BigInt(Math.floor(ratio * 1e18))) / BigInt(1e18);
      setAmount0(ethers.formatEther(amount0Out));
    } catch (err) {
      console.error('计算金额失败:', err);
    }
  };

  const handleAddLiquidity = async () => {
    if (!account) {
      setError('请先连接钱包');
      return;
    }

    if (!amount0 || !amount1 || isNaN(amount0) || isNaN(amount1) ||
      parseFloat(amount0) <= 0 || parseFloat(amount1) <= 0) {
      setError('请输入有效金额');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const pair = tokenPairs.find(p => p.label === selectedPair);
      if (!pair) {
        throw new Error('请选择代币对');
      }

      const amount0Wei = ethers.parseEther(amount0);
      const amount1Wei = ethers.parseEther(amount1);

      // 验证比例是否正确
      const ratio = Number(poolInfo.reserveB) / Number(poolInfo.reserveA);
      const expectedAmount1 = (amount0Wei * BigInt(Math.floor(ratio * 1e18))) / BigInt(1e18);

      // 检查比例是否完全匹配
      if (amount1Wei !== expectedAmount1) {
        throw new Error('代币比例必须与池子比例完全匹配');
      }

      await dexService.addLiquidity(
        pair.tokenA,
        pair.tokenB,
        amount0Wei,
        amount1Wei
      );

      setSuccess('添加流动性成功');
      setAmount0('');
      setAmount1('');
    } catch (err) {
      console.error('添加流动性失败:', err);
      setError('添加流动性失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          流动性池
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 代币对选择 */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>选择代币对</InputLabel>
              <Select
                value={selectedPair}
                onChange={handlePairChange}
                label="选择代币对"
              >
                {tokenPairs.map((pair) => (
                  <MenuItem key={pair.label} value={pair.label}>
                    {pair.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 代币输入 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="第一个代币数量"
              value={amount0}
              onChange={handleAmount0Change}
              type="number"
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="第二个代币数量"
              value={amount1}
              onChange={handleAmount1Change}
              type="number"
              margin="normal"
            />
          </Grid>

          {/* 添加流动性按钮 */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddLiquidity}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : '添加流动性'}
            </Button>
          </Grid>

          {/* 所有池子信息 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              所有流动性池
            </Typography>
            <Grid container spacing={2}>
              {allPools.map((pool) => (
                <Grid item xs={12} md={4} key={pool.label}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {pool.label}
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar src={tokenService.getTokenIcon(tokenInfo.find(t => t.address === pool.tokenA)?.symbol)}>
                              {tokenInfo.find(t => t.address === pool.tokenA)?.symbol?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${tokenInfo.find(t => t.address === pool.tokenA)?.name || 'Token A'} 储备量`}
                            secondary={ethers.formatEther(pool.info.reserveA)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar src={tokenService.getTokenIcon(tokenInfo.find(t => t.address === pool.tokenB)?.symbol)}>
                              {tokenInfo.find(t => t.address === pool.tokenB)?.symbol?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${tokenInfo.find(t => t.address === pool.tokenB)?.name || 'Token B'} 储备量`}
                            secondary={ethers.formatEther(pool.info.reserveB)}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DexLiquidity; 