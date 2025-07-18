import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ChatRoom from './components/chat/ChatRoom';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat/:roomId" 
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;