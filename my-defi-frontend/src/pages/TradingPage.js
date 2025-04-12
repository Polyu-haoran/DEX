import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ethers } from 'ethers';
import { tokenService } from '../services/tokenService';
import { dexService } from '../services/dexService';
import {
  TOKEN_A_ADDRESS,
  TOKEN_B_ADDRESS,
  TOKEN_C_ADDRESS
} from '../config/contracts';

const TradingPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState([]);
  const [allPools, setAllPools] = useState([]);
  const [transactions, setTransactions] = useState({
    'TKA/TKB': [],
    'TKA/TKC': [],
    'TKB/TKC': []
  });

  useEffect(() => {
    const loadTokenInfo = async () => {
      try {
        const info = await tokenService.getAllTokenInfo();
        setTokenInfo(info);
      } catch (err) {
        console.error('加载代币信息失败:', err);
      }
    };

    const loadAllPools = async () => {
      try {
        const pairs = [
          { label: 'TKA/TKB', tokenA: TOKEN_A_ADDRESS, tokenB: TOKEN_B_ADDRESS },
          { label: 'TKA/TKC', tokenA: TOKEN_A_ADDRESS, tokenB: TOKEN_C_ADDRESS },
          { label: 'TKB/TKC', tokenA: TOKEN_B_ADDRESS, tokenB: TOKEN_C_ADDRESS }
        ];

        const pools = await Promise.all(
          pairs.map(async (pair) => {
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
        setError('加载池子信息失败');
      } finally {
        setLoading(false);
      }
    };

    const loadTransactions = async () => {
      try {
        // 这里应该从合约或后端API获取交易记录
        // 以下是模拟数据，实际应用中需要替换为真实数据
        const mockTransactions = {
          'TKA/TKB': [
            { id: 1, type: 'swap', from: 'TKA', to: 'TKB', amount: '10', price: '0.5', time: '2023-05-01 10:30' },
            { id: 2, type: 'swap', from: 'TKB', to: 'TKA', amount: '5', price: '2.0', time: '2023-05-01 11:45' },
            { id: 3, type: 'addLiquidity', amount: '20', time: '2023-05-01 12:15' }
          ],
          'TKA/TKC': [
            { id: 1, type: 'swap', from: 'TKA', to: 'TKC', amount: '8', price: '0.8', time: '2023-05-01 09:20' },
            { id: 2, type: 'addLiquidity', amount: '15', time: '2023-05-01 10:10' }
          ],
          'TKB/TKC': [
            { id: 1, type: 'swap', from: 'TKB', to: 'TKC', amount: '12', price: '1.2', time: '2023-05-01 08:30' },
            { id: 2, type: 'swap', from: 'TKC', to: 'TKB', amount: '6', price: '0.8', time: '2023-05-01 09:45' },
            { id: 3, type: 'addLiquidity', amount: '25', time: '2023-05-01 11:30' }
          ]
        };

        setTransactions(mockTransactions);
      } catch (err) {
        console.error('加载交易记录失败:', err);
      }
    };

    loadTokenInfo();
    loadAllPools();
    loadTransactions();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          流动性池信息
        </Typography>

        {error && (
          <Typography color="error" align="center" sx={{ mb: 3 }}>
            {error}
          </Typography>
        )}

        {/* 代币图标 */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          mb: 4,
          pl: 2
        }}>
          <Avatar
            sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
            src={tokenService.getTokenIcon('TKA')}
          >
            TKA
          </Avatar>
          <Avatar
            sx={{ width: 40, height: 40, bgcolor: 'secondary.main' }}
            src={tokenService.getTokenIcon('TKB')}
          >
            TKB
          </Avatar>
          <Avatar
            sx={{ width: 40, height: 40, bgcolor: 'success.main' }}
            src={tokenService.getTokenIcon('TKC')}
          >
            TKC
          </Avatar>
        </Box>

        {/* 三角形布局的流动性池信息 */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          height: '600px'
        }}>
          {/* 顶部池子 (TKA/TKB) */}
          <Box sx={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px'
          }}>
            {allPools.find(pool => pool.label === 'TKA/TKB') && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    TKA/TKB
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={tokenService.getTokenIcon('TKA')}>TKA</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="TKA 储备量"
                        secondary={ethers.formatEther(allPools.find(pool => pool.label === 'TKA/TKB').info.reserveA)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={tokenService.getTokenIcon('TKB')}>TKB</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="TKB 储备量"
                        secondary={ethers.formatEther(allPools.find(pool => pool.label === 'TKA/TKB').info.reserveB)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* 左下池子 (TKA/TKC) */}
          <Box sx={{
            position: 'absolute',
            bottom: '100px',
            left: '25%',
            transform: 'translateX(-50%)',
            width: '300px'
          }}>
            {allPools.find(pool => pool.label === 'TKA/TKC') && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    TKA/TKC
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={tokenService.getTokenIcon('TKA')}>TKA</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="TKA 储备量"
                        secondary={ethers.formatEther(allPools.find(pool => pool.label === 'TKA/TKC').info.reserveA)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={tokenService.getTokenIcon('TKC')}>TKC</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="TKC 储备量"
                        secondary={ethers.formatEther(allPools.find(pool => pool.label === 'TKA/TKC').info.reserveB)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* 右下池子 (TKB/TKC) */}
          <Box sx={{
            position: 'absolute',
            bottom: '100px',
            right: '25%',
            transform: 'translateX(50%)',
            width: '300px'
          }}>
            {allPools.find(pool => pool.label === 'TKB/TKC') && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    TKB/TKC
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={tokenService.getTokenIcon('TKB')}>TKB</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="TKB 储备量"
                        secondary={ethers.formatEther(allPools.find(pool => pool.label === 'TKB/TKC').info.reserveA)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={tokenService.getTokenIcon('TKC')}>TKC</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="TKC 储备量"
                        secondary={ethers.formatEther(allPools.find(pool => pool.label === 'TKB/TKC').info.reserveB)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Paper>

      {/* 交易记录区域 */}
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          交易记录
        </Typography>

        <Grid container spacing={4}>
          {/* TKA/TKB 交易记录 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  TKA/TKB 交易记录
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>类型</TableCell>
                        <TableCell>详情</TableCell>
                        <TableCell>时间</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions['TKA/TKB'].map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {tx.type === 'swap' ? '交换' : '添加流动性'}
                          </TableCell>
                          <TableCell>
                            {tx.type === 'swap'
                              ? `${tx.amount} ${tx.from} → ${tx.to} (价格: ${tx.price})`
                              : `添加 ${tx.amount} 流动性`}
                          </TableCell>
                          <TableCell>{tx.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* TKA/TKC 交易记录 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  TKA/TKC 交易记录
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>类型</TableCell>
                        <TableCell>详情</TableCell>
                        <TableCell>时间</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions['TKA/TKC'].map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {tx.type === 'swap' ? '交换' : '添加流动性'}
                          </TableCell>
                          <TableCell>
                            {tx.type === 'swap'
                              ? `${tx.amount} ${tx.from} → ${tx.to} (价格: ${tx.price})`
                              : `添加 ${tx.amount} 流动性`}
                          </TableCell>
                          <TableCell>{tx.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* TKB/TKC 交易记录 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  TKB/TKC 交易记录
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>类型</TableCell>
                        <TableCell>详情</TableCell>
                        <TableCell>时间</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions['TKB/TKC'].map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {tx.type === 'swap' ? '交换' : '添加流动性'}
                          </TableCell>
                          <TableCell>
                            {tx.type === 'swap'
                              ? `${tx.amount} ${tx.from} → ${tx.to} (价格: ${tx.price})`
                              : `添加 ${tx.amount} 流动性`}
                          </TableCell>
                          <TableCell>{tx.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TradingPage; 