
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import OfflineModeIndicator from './components/OfflineModeIndicator';
import { EnvironmentChecker } from './utils/envChecker';
import Home from './pages/Home';
import Reels from './pages/Reels';
import Create from './pages/Create';
import Explore from './pages/Explore';
import Search from './pages/Search';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Chat from './pages/Chat';
import SmartPromptStudio from './pages/SmartPromptStudio';
import TestSmartFeatures from './pages/TestSmartFeatures';
import PromptTransformationDemo from './components/PromptTransformationDemo';
import TestImageAnalysis from './components/TestImageAnalysis';
import SimpleEnhancedPromptsTest from './components/SimpleEnhancedPromptsTest';

import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TestPage from './pages/TestPage';

// Component that contains all routes - must be inside AuthProvider
const AppRoutes = () => {
  // Log environment info on startup
  useEffect(() => {
    EnvironmentChecker.logEnvironmentInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Routes>
        {/* Public routes */}
        <Route
          path="/auth/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <ProtectedRoute requireAuth={false}>
              <Signup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <ProtectedRoute requireAuth={false}>
              <AuthCallback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/verify-email"
          element={
            <ProtectedRoute requireAuth={false}>
              <VerifyEmail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <ForgotPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <ResetPassword />
            </ProtectedRoute>
          }
        />

        {/* Protected routes with Navigation */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reels"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <Reels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <Create />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <Explore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/smart-studio"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <SmartPromptStudio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transform"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <PromptTransformationDemo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/:username"
          element={
            <ProtectedRoute>
              <OfflineModeIndicator />
              <Navigation />
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test"
          element={
            <ProtectedRoute requireAuth={false}>
              <TestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-ai"
          element={
            <ProtectedRoute requireAuth={false}>
              <TestImageAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-simple"
          element={
            <ProtectedRoute requireAuth={false}>
              <SimpleEnhancedPromptsTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-smart-features"
          element={
            <ProtectedRoute requireAuth={false}>
              <TestSmartFeatures />
            </ProtectedRoute>
          }
        />

      </Routes>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;