import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { Toaster } from "./components/ui/toaster";
import { Navbar } from "./components/ui/navbar";
import Login from "@/screens/auth/login";
import AdminPanel from "@/screens/admin-panel";
import PlayoutDashboard from "@/screens/playout-dashboard";
import LobbyDashboard from "@/screens/playout-dashboard/lobbyDashboard";
import ProtectedRoute from "./navigation/protectedRouters";
import { ScrollArea } from "./components/ui/scroll-area";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import footerLogo from "@/assets/images/app-white-logo-footer.png";
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#1E1E1E]  text-white">
      <Navbar />
      <main className=" mx-auto p-4 overflow-y-auto">
        <ScrollArea>{children}</ScrollArea>
      </main>
    </div>
  );
};

const NoInternetPage = () => (
  <div className="min-h-screen bg-[#1E1E1E] text-white flex items-center justify-center">
    <div className="flex-col">
    <h1>No Internet Connection</h1>
    <p>Please check your internet connection and try again.</p>
    <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
    <div className="fixed bottom-4 right-4">
        <img src={footerLogo} alt="Watermark" width={100} height={40} />
      </div>
  </div>
);
const App = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  if(isOnline){
    console.log("connection stablish")
  }else{
    console.log("not connected enternet")
    return <NoInternetPage/>
  }

  if (!isOnline) {
    return <NoInternetPage/>;
  }
  return (
    <>
      <Router>
        <Routes>
          {/* Login Route (no MainLayout) */}
          <Route path="/" element={<Login />} />

          {/* Authenticated Routes */}
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute requiredRoles={["admin", "tech"]}>
                <MainLayout>
                  <AdminPanel />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRoles={["operator"]}>
                <MainLayout>
                  <LobbyDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requiredRoles={["operator"]}>
                <MainLayout>
                  <PlayoutDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all route for unauthenticated users */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
};

export default App;
