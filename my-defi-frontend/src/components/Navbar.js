//创建一个Navbar组件（导航栏）
// 导入必要的组件和库
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import WalletConnect from './WalletConnect';

// 创建Navbar组件 
function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DeFi Exchange
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">
            首页
          </Button>
          <Button color="inherit" component={RouterLink} to="/exchange">
            交易所
          </Button>
          <Button color="inherit" component={RouterLink} to="/trading">
            流动性池
          </Button>
          <Button color="inherit" component={RouterLink} to="/wallet">
            钱包
          </Button>
          <WalletConnect />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 