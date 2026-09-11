import { useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage/LoginPage';
import EmailRegistrationPage from './pages/LoginPage/EmailRegistrationPage';
import LandingPage from './pages/LandingPage/LandingPage';
import Home from './pages/Home';
import AuthCallbackPage from './pages/AuthCallbackPage';

function App() {
  const { checkAuthStatus, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.50'
        }}
      >
        <CircularProgress sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
            },
            error: {
              duration: 5000,
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route
            path="/landing_page/*"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />


          <Route
            path="/register"
            element={
              <PublicRoute>
                <EmailRegistrationPage />
              </PublicRoute>
            }
          />

          {/* OAuth Callback Route */}
          <Route
            path="/auth/callback"
            element={<AuthCallbackPage />}
          />

          {/* Protected Routes */}
          <Route
            path="/home/*"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Home Route - Redirect based on auth status */}
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          {/* Catch all route - redirect to login */}
          <Route
            path="*"
            element={<Navigate to="/landing_page" replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


// import React from 'react'
// import AiChat from './pages/AiChat/AiChat'

// const App = () => {
//   return (
//     <div>
//       <AiChat></AiChat>
//     </div>
//   )
// }

// export default App