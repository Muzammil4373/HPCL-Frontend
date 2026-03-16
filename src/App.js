import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage    from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventPage    from './pages/EventPage';
import WinnersPage  from './pages/WinnersPage';
import ImportPage   from './pages/ImportPage';
import WinnerPage   from './pages/WinnerPage';
import Navbar       from './components/Navbar';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {/* Hide navbar on winner reveal page */}
      {user && <Navbar />}
      <Routes>
        <Route path="/login"          element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/dashboard"      element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/event/:eventNumber" element={<ProtectedRoute><EventPage /></ProtectedRoute>} />
        <Route path="/winner-reveal"  element={<ProtectedRoute><WinnerPage /></ProtectedRoute>} />
        <Route path="/winners"        element={<ProtectedRoute><WinnersPage /></ProtectedRoute>} />
        <Route path="/import"         element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="light" />
      </Router>
    </AuthProvider>
  );
}

export default App;
