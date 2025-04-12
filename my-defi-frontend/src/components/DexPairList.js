import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress
} from '@mui/material';
import { dexService } from '../services/dexService';
import { tokenService } from '../services/tokenService';

const DexPairList = ({ onSelectPair }) => {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPairs();
  }, []);

  const loadPairs = async () => {
    try {
      setLoading(true);
      // 获取所有代币信息
      const tokens = await tokenService.getAllTokenInfo();

      // 创建所有可能的交易对组合
      const possiblePairs = [];
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          possiblePairs.push({
            tokenA: tokens[i],
            tokenB: tokens[j],
            label: `${tokens[i].symbol}/${tokens[j].symbol}`
          });
        }
      }

      // 获取每个交易对的信息
      const pairsWithInfo = await Promise.all(
        possiblePairs.map(async (pair) => {
          try {
            const pairAddress = await dexService.createPair(pair.tokenA.address, pair.tokenB.address);
            const pairInfo = await dexService.getPairInfo(pairAddress);
            const price = await dexService.getPrice(pairAddress, pair.tokenA.address);

            return {
              ...pair,
              address: pairAddress,
              reserveA: pairInfo.reserveA,
              reserveB: pairInfo.reserveB,
              price: price
            };
          } catch (error) {
            console.error(`Error loading pair ${pair.label}:`, error);
            return null;
          }
        })
      );

      // 过滤掉加载失败的交易对
      const validPairs = pairsWithInfo.filter(pair => pair !== null);
      setPairs(validPairs);
    } catch (error) {
      console.error('Error loading pairs:', error);
      setError('加载交易对失败');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount, decimals) => {
    return tokenService.formatTokenAmount(amount, decimals);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        可用交易对
      </Typography>
      <Grid container spacing={2}>
        {pairs.map((pair) => (
          <Grid item xs={12} sm={6} md={4} key={pair.label}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {pair.label}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  流动性: {formatAmount(pair.reserveA, pair.tokenA.decimals)} {pair.tokenA.symbol} /
                  {formatAmount(pair.reserveB, pair.tokenB.decimals)} {pair.tokenB.symbol}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  价格: 1 {pair.tokenA.symbol} = {formatAmount(pair.price, pair.tokenB.decimals)} {pair.tokenB.symbol}
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => onSelectPair(pair)}
                  >
                    选择
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DexPairList; 