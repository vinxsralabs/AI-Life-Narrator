import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import StoryView from './pages/StoryView';
import Upload from './pages/Upload';
import Narrate from './pages/Narrate';
import Therapy from './pages/Therapy';
import LoadingSpinner from './components/LoadingSpinner';
import AnimatedBackground from './components/ui/AnimatedBackground';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route component (redirects if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`app ${theme} min-h-screen bg-night-bg`}>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <Login />
                </motion.div>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <Register />
                </motion.div>
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Navbar />
                  <Dashboard />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Navbar />
                  <Timeline />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Navbar />
                  <Upload />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/narrate"
            element={
              <ProtectedRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Navbar />
                  <Narrate />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/story/:id"
            element={
              <ProtectedRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Navbar />
                  <StoryView />
                </motion.div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/therapy"
            element={
              <ProtectedRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Navbar />
                  <Therapy />
                </motion.div>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default App; 