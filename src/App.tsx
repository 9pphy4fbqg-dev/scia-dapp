
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateSalePage from './pages/PrivateSale';
import ProfilePage from './pages/Profile';
import Layout from './pages/Layout';
import SplashPage from './pages/Splash';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 根路径重定向到 /splash */}
        <Route path="/" element={<Navigate to="/splash" replace />} />
        {/* Splash页面 */}
        <Route path="/splash" element={<SplashPage />} />
        
        {/* 嵌套路由：所有页面使用统一Layout */}
        <Route element={<Layout />}>
          <Route path="/buy" element={<PrivateSalePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/data" element={<div>该功能正在开发中</div>} />
          <Route path="/community" element={<div>该功能正在开发中</div>} />
          <Route path="/mall" element={<div>该功能正在开发中</div>} />
          <Route path="/nft" element={<div>该功能正在开发中</div>} />
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/statistics" element={<div>该功能正在开发中</div>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;