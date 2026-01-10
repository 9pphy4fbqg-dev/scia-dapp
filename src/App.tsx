import React from 'react'
import { Routes, Route } from 'react-router-dom'
import PrivateSalePage from './pages/PrivateSale'
import ProfilePage from './pages/Profile'
import StatisticsPage from './pages/Statistics'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<PrivateSalePage />} />
        <Route path="/data" element={<div>该功能正在开发中</div>} />
        <Route path="/community" element={<div>该功能正在开发中</div>} />
        <Route path="/mall" element={<div>该功能正在开发中</div>} />
        <Route path="/statistics" element={<div>该功能正在开发中</div>} />
      </Routes>
    </div>
  )
}

export default App