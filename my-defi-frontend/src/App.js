//App.js用来创建基本的路由结构
// 创建主题
// 创建App组件
// 导出App组件

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Exchange from './pages/Exchange';
import { Provider } from 'react-redux';
import { store } from './store';
import TradingPage from './pages/TradingPage';
import Home from './pages/Home';
import Wallet from './pages/Wallet';

// 创建主题
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <Router>
          <Navbar />
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/exchange" element={<Exchange />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/trading" element={<TradingPage />} />
            </Routes>
          </Container>
        </Router>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
