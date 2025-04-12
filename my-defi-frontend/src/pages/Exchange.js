import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Divider,
  Slider
} from '@mui/material';
import DexLiquidity from '../components/DexLiquidity';
import { tokenService } from '../services/tokenService';
import { dexService } from '../services/dexService';
import { ammService } from '../services/ammService';
import { useSelector } from 'react-redux';
import {
  TOKEN_A_ADDRESS,
  TOKEN_B_ADDRESS,
  TOKEN_C_ADDRESS
} from '../config/contracts';

function Exchange() {
  const { account } = useSelector((state) => state.wallet);
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPair, setSelectedPair] = useState('');
  const [tradeDirection, setTradeDirection] = useState('AtoB');
  const [tokenPairs, setTokenPairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderBook, setOrderBook] = useState({
    bids: [], // 买单
    asks: []  // 卖单
  });
  const [currentPrice, setCurrentPrice] = useState('0');

  // 无常损失计算相关状态
  const [priceChange, setPriceChange] = useState(1);
  const [impermanentLoss, setImpermanentLoss] = useState(0);
  const [initialPrice, setInitialPrice] = useState(1);
  const [currentPoolPrice, setCurrentPoolPrice] = useState(1);

  useEffect(() => {
    const initDex = async () => {
      try {
        await dexService.init();
        await ammService.init();
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
        console.error('初始化 DEX 失败:', err);
        setError('初始化 DEX 失败: ' + err.message);
      }
    };

    initDex();
  }, []);

  // 监听选中的交易对变化
  useEffect(() => {
    if (selectedPair) {
      loadOrderBook();
      loadCurrentPrice();
      calculateImpermanentLoss();
    }
  }, [selectedPair]);

  // 监听价格变化
  useEffect(() => {
    calculateImpermanentLoss();
  }, [priceChange, currentPoolPrice]);

  // 加载订单薄数据
  const loadOrderBook = async () => {
    try {
      const pair = tokenPairs.find(p => p.label === selectedPair);
      if (!pair) return;

      const pairInfo = await dexService.getPairInfo(pair.tokenA, pair.tokenB);
      const reserveA = ethers.formatEther(pairInfo.reserveA);
      const reserveB = ethers.formatEther(pairInfo.reserveB);

      // 根据储备量生成模拟订单数据
      const currentPrice = parseFloat(reserveB) / parseFloat(reserveA);

      // 生成买单（价格低于当前价格）
      const bids = Array.from({ length: 10 }, (_, i) => ({
        price: (currentPrice * (1 - (i + 1) * 0.01)).toFixed(6),
        amount: (Math.random() * 100).toFixed(4),
        total: ((currentPrice * (1 - (i + 1) * 0.01)) * Math.random() * 100).toFixed(4)
      }));

      // 生成卖单（价格高于当前价格）
      const asks = Array.from({ length: 10 }, (_, i) => ({
        price: (currentPrice * (1 + (i + 1) * 0.01)).toFixed(6),
        amount: (Math.random() * 100).toFixed(4),
        total: ((currentPrice * (1 + (i + 1) * 0.01)) * Math.random() * 100).toFixed(4)
      }));

      setOrderBook({ bids, asks });
    } catch (err) {
      console.error('加载订单薄失败:', err);
      setError('加载订单薄失败: ' + err.message);
    }
  };

  // 加载当前价格
  const loadCurrentPrice = async () => {
    try {
      const pair = tokenPairs.find(p => p.label === selectedPair);
      if (!pair) return;

      const pairInfo = await dexService.getPairInfo(pair.tokenA, pair.tokenB);
      const price = ethers.formatEther(pairInfo.reserveB) / ethers.formatEther(pairInfo.reserveA);
      setCurrentPrice(price.toFixed(6));
      setCurrentPoolPrice(price);
      setInitialPrice(price);
    } catch (err) {
      console.error('加载价格失败:', err);
      setError('加载价格失败: ' + err.message);
    }
  };

  // 计算预计输出数量
  const calculateEstimatedOutput = async (inputAmount) => {
    if (!inputAmount || isNaN(inputAmount) || parseFloat(inputAmount) <= 0) {
      setEstimatedOutput('0');
      return;
    }

    try {
      const pair = tokenPairs.find(p => p.label === selectedPair);
      if (!pair) return;

      const pairInfo = await dexService.getPairInfo(pair.tokenA, pair.tokenB);
      const amountIn = ethers.parseEther(inputAmount);

      // 根据交易方向计算输出数量
      let amountOut;
      if (tradeDirection === 'AtoB') {
        amountOut = (pairInfo.reserveB * amountIn) / (pairInfo.reserveA + amountIn);
      } else {
        amountOut = (pairInfo.reserveA * amountIn) / (pairInfo.reserveB + amountIn);
      }

      setEstimatedOutput(ethers.formatEther(amountOut));
    } catch (err) {
      console.error('计算预计输出失败:', err);
      setEstimatedOutput('0');
    }
  };

  // 计算无常损失
  const calculateImpermanentLoss = () => {
    try {
      const loss = ammService.calculateImpermanentLoss(priceChange);
      setImpermanentLoss(loss);
    } catch (err) {
      console.error('计算无常损失失败:', err);
    }
  };

  // 处理价格变化滑块
  const handlePriceChange = (event, newValue) => {
    setPriceChange(newValue);
  };

  // 监听数量变化和交易方向变化
  useEffect(() => {
    if (amount) {
      calculateEstimatedOutput(amount);
    } else {
      setEstimatedOutput('0');
    }
  }, [amount, selectedPair, tradeDirection]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePairChange = (event) => {
    setSelectedPair(event.target.value);
  };

  const handleTrade = async () => {
    if (!account) {
      setError('请先连接钱包');
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
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

      const amountIn = ethers.parseEther(amount);
      const pairInfo = await dexService.getPairInfo(pair.tokenA, pair.tokenB);

      // 根据交易方向选择代币和交易方法
      const [fromToken, toToken] = tradeDirection === 'AtoB'
        ? [pair.tokenA, pair.tokenB]
        : [pair.tokenB, pair.tokenA];

      // 授权代币
      const tokenContract = dexService.getTokenContract(fromToken);
      await tokenContract.approve(pairInfo.pairAddress, amountIn);

      // 执行交易
      const pairContract = dexService.getPairContract(pairInfo.pairAddress);
      const tx = tradeDirection === 'AtoB'
        ? await pairContract.swapAForB(amountIn)
        : await pairContract.swapBForA(amountIn);
      await tx.wait();

      setSuccess('交易成功');
      setAmount('');
    } catch (err) {
      console.error('交易失败:', err);
      setError('交易失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="交易" />
            <Tab label="添加流动性" />
          </Tabs>
        </Paper>
      </Grid>

      {activeTab === 0 && (
        <>
          {/* 订单簿 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                订单簿
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
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
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>价格</TableCell>
                      <TableCell align="right">数量</TableCell>
                      <TableCell align="right">总额</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* 卖单标题 */}
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 'bold' }}>
                          卖单 (Sell)
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {orderBook.asks.slice().reverse().map((ask, index) => (
                      <TableRow key={`ask-${index}`} sx={{ color: 'error.main' }}>
                        <TableCell>{ask.price}</TableCell>
                        <TableCell align="right">{ask.amount}</TableCell>
                        <TableCell align="right">{ask.total}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="subtitle2">
                          当前价格: {currentPrice}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {/* 买单标题 */}
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 'bold' }}>
                          买单 (Buy)
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {orderBook.bids.map((bid, index) => (
                      <TableRow key={`bid-${index}`} sx={{ color: 'success.main' }}>
                        <TableCell>{bid.price}</TableCell>
                        <TableCell align="right">{bid.amount}</TableCell>
                        <TableCell align="right">{bid.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* 交易卡片 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                交易
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>交易方向</InputLabel>
                <Select
                  value={tradeDirection}
                  onChange={(e) => setTradeDirection(e.target.value)}
                  label="交易方向"
                >
                  <MenuItem value="AtoB">A → B</MenuItem>
                  <MenuItem value="BtoA">B → A</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="输入数量"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body1" gutterBottom>
                预计输出: {estimatedOutput}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleTrade}
                disabled={loading || !account}
              >
                {loading ? <CircularProgress size={24} /> : '交易'}
              </Button>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </Paper>

            {/* 无常损失计算器（交易卡片下方） */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                无常损失计算器
              </Typography>
              <Typography variant="body2" gutterBottom>
                初始价格: {initialPrice.toFixed(6)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                当前价格: {(initialPrice * priceChange).toFixed(6)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                价格变化倍数: {priceChange.toFixed(2)}x
              </Typography>
              <Slider
                value={priceChange}
                onChange={handlePriceChange}
                min={0.1}
                max={10}
                step={0.1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value.toFixed(2)}x`}
                sx={{ my: 2 }}
              />
              <Alert severity={impermanentLoss < 0 ? "error" : "info"} sx={{ mt: 2 }}>
                <Typography variant="body1">
                  无常损失: {(impermanentLoss * 100).toFixed(2)}%
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </>
      )}

      {activeTab === 1 && (
        <Grid item xs={12}>
          <DexLiquidity />
        </Grid>
      )}
    </Grid>
  );
}

export default Exchange; 