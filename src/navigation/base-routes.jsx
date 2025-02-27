//     import Login from '@/screens/auth/login';
// import PlayoutDashboard from '@/screens/playout-dashboard';
// import LobbyDashboard from '@/screens/playout-dashboard/lobbyDashboard';
//     import React from 'react'
//     import {Navigate, Route, Routes } from "react-router-dom";

//     function BaseRoutes() {
//     return (
//         <Routes>
//         <Route path="/dashboard" element={<LobbyDashboard />} />
//         <Route path="/lobby" element={<PlayoutDashboard/>} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//     )
//     }

//     export default BaseRoutes;

// BaseRoutes.js
import PlayoutDashboard from '@/screens/playout-dashboard';
import LobbyDashboard from '@/screens/playout-dashboard/lobbyDashboard';
import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";

export default function BaseRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<LobbyDashboard />} />
      <Route path="/lobby" element={<PlayoutDashboard />} />
      {/* <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
    </Routes>
  );
}

//  BaseRoutes;