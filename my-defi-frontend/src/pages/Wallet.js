import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Link
} from '@mui/material';
import { blockchainService } from '../services/blockchainService';
import { tokenService } from '../services/tokenService';
import { ethers } from 'ethers';

const Wallet = () => {
  const { account } = useSelector((state) => state.wallet);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenBalances, setTokenBalances] = useState({});
  const [tokenInfo, setTokenInfo] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (!account) return;

      try {
        setLoading(true);
        setError('');

        // 获取 ETH 余额
        const walletBalance = await blockchainService.getBalance(account);
        setBalance(walletBalance);

        // 获取网络信息
        const networkInfo = await blockchainService.getNetwork();
        setNetwork(networkInfo);

        // 获取代币信息
        const tokens = await tokenService.getAllTokenInfo();
        setTokenInfo(tokens);

        // 获取代币余额
        const balances = await tokenService.getUserTokenBalances(account);
        setTokenBalances(balances);

        // 获取交易历史
        await fetchTransactionHistory();

      } catch (err) {
        console.error('获取钱包详情失败:', err);
        setError('获取钱包详情失败: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletDetails();
  }, [account]);

  const fetchTransactionHistory = async () => {
    try {
      // 获取当前区块高度
      const currentBlock = await blockchainService.provider.getBlockNumber();
      // 获取过去1000个区块的交易
      const fromBlock = Math.max(0, currentBlock - 1000);

      // 获取交易历史
      const history = await blockchainService.provider.getLogs({
        address: account,
        fromBlock: fromBlock,
        toBlock: currentBlock
      });

      // 处理交易数据
      const processedTransactions = await Promise.all(
        history.map(async (log) => {
          const tx = await blockchainService.provider.getTransaction(log.transactionHash);
          const block = await tx.getBlock();
          const timestamp = block.timestamp * 1000; // 转换为毫秒
          const value = ethers.formatEther(tx.value);
          const gasUsed = tx.gasLimit.toString();
          const gasPrice = ethers.formatUnits(tx.gasPrice, 'gwei');
          const gasCost = ethers.formatEther(tx.gasPrice.mul(tx.gasLimit));

          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: value,
            timestamp: timestamp,
            gasUsed: gasUsed,
            gasPrice: gasPrice,
            gasCost: gasCost,
            status: tx.status === 1 ? '成功' : '失败'
          };
        })
      );

      // 按时间戳排序，最新的在前
      processedTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(processedTransactions);
    } catch (err) {
      console.error('获取交易历史失败:', err);
      setError('获取交易历史失败: ' + err.message);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!account) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="info">
          请先连接钱包以查看详情
        </Alert>
      </Box>
    );
  }

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
        <Typography variant="h4" component="h1" gutterBottom>
          钱包详情
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 钱包地址卡片 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  钱包地址
                </Typography>
                <Typography variant="h6" component="div">
                  {account}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`${account.slice(0, 6)}...${account.slice(-4)}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* ETH 余额卡片 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  ETH 余额
                </Typography>
                <Typography variant="h6" component="div">
                  {balance} ETH
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 网络信息卡片 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  网络信息
                </Typography>
                <Typography variant="body1">
                  网络名称: {network?.name || 'unknown'}
                </Typography>
                <Typography variant="body1">
                  链ID: {network?.chainId?.toString() || 'unknown'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 代币余额列表 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  代币余额
                </Typography>
                <List>
                  {tokenInfo.map((token) => (
                    <ListItem key={token.address}>
                      <ListItemAvatar>
                        <Avatar src={tokenService.getTokenIcon(token.symbol)}>
                          {token.symbol[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={token.name}
                        secondary={`${tokenService.formatTokenAmount(
                          tokenBalances[token.address] || '0',
                          token.decimals
                        )} ${token.symbol}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* 交易历史 */}
        <Typography variant="h5" gutterBottom>
          交易历史
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>交易哈希</TableCell>
                <TableCell>时间</TableCell>
                <TableCell>从</TableCell>
                <TableCell>到</TableCell>
                <TableCell>金额 (ETH)</TableCell>
                <TableCell>Gas 费用 (ETH)</TableCell>
                <TableCell>状态</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tx) => (
                  <TableRow key={tx.hash}>
                    <TableCell>
                      <Link
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(tx.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {`${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                    </TableCell>
                    <TableCell>
                      {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : '-'}
                    </TableCell>
                    <TableCell>{parseFloat(tx.value).toFixed(6)}</TableCell>
                    <TableCell>{parseFloat(tx.gasCost).toFixed(6)}</TableCell>
                    <TableCell>
                      <Typography
                        color={tx.status === '成功' ? 'success.main' : 'error.main'}
                      >
                        {tx.status}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={transactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="每页行数:"
          />
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Wallet; 