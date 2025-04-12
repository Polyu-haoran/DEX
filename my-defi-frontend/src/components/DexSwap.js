import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { dexService } from '../services/dexService';
import { tokenService } from '../services/tokenService';
import { blockchainService } from '../services/blockchainService';

const DexSwap = ({ pair }) => {
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userBalance, setUserBalance] = useState(null);

  useEffect(() => {
    if (pair) {
      loadUserBalance();
    }
  }, [pair]);

  const loadUserBalance = async () => {
    try {
      const account = await blockchainService.getAccount();
      const balanceA = await dexService.getTokenBalance(pair.tokenA.address, account);
      const balanceB = await dexService.getTokenBalance(pair.tokenB.address, account);

      setUserBalance({
        [pair.tokenA.address]: balanceA,
        [pair.tokenB.address]: balanceB
      });
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  const handleAmountChange = async (e) => {
    const value = e.target.value;
    setAmount(value);

    if (value && !isNaN(value) && parseFloat(value) > 0) {
      try {
        const parsedAmount = tokenService.parseTokenAmount(value, pair.tokenA.decimals);
        const price = await dexService.getPrice(pair.address, pair.tokenA.address);
        const outputAmount = (parsedAmount * price) / BigInt(10 ** 18);
        setEstimatedOutput(tokenService.formatTokenAmount(outputAmount, pair.tokenB.decimals));
      } catch (error) {
        console.error('Error calculating output:', error);
      }
    } else {
      setEstimatedOutput('');
    }
  };

  const handleSwap = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('请输入有效金额');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const parsedAmount = tokenService.parseTokenAmount(amount, pair.tokenA.decimals);
      await dexService.swapTokens(pair.address, pair.tokenA.address, parsedAmount);

      setSuccess('交换成功');
      setAmount('');
      setEstimatedOutput('');
      loadUserBalance();
    } catch (error) {
      console.error('Error swapping tokens:', error);
      setError('交换失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (address) => {
    if (!userBalance || !userBalance[address]) return '0';
    const token = address === pair.tokenA.address ? pair.tokenA : pair.tokenB;
    return tokenService.formatTokenAmount(userBalance[address], token.decimals);
  };

  if (!pair) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>请选择一个交易对</Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          交换 {pair.tokenA.symbol} 到 {pair.tokenB.symbol}
        </Typography>

        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            余额: {formatBalance(pair.tokenA.address)} {pair.tokenA.symbol}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label={`输入 ${pair.tokenA.symbol} 数量`}
              variant="outlined"
              fullWidth
              type="number"
              value={amount}
              onChange={handleAmountChange}
              disabled={loading}
            />
          </Grid>

          {estimatedOutput && (
            <Grid item xs={12}>
              <Typography variant="body1">
                预计获得: {estimatedOutput} {pair.tokenB.symbol}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSwap}
              disabled={loading || !amount || isNaN(amount) || parseFloat(amount) <= 0}
            >
              {loading ? <CircularProgress size={24} /> : '交换'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Box mt={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {success && (
          <Box mt={2}>
            <Alert severity="success">{success}</Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DexSwap; 