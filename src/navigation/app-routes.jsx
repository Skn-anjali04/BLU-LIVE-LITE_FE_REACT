import AdminPanel from '@/screens/admin-panel';
import Login from '@/screens/auth/login';
import React, { useState } from 'react'
import {  Navigate, Route, Routes } from "react-router-dom";
function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/" element={<Login />} /> */}
      <Route path="/admin-panel" element={<AdminPanel />} />
       <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes;