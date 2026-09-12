import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Lenis from 'lenis';
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

  // Global Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });

    let frame;
    function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-base-200">
        <div className="flex items-center gap-3 text-sm text-base-content/60">
          <span className="loading loading-spinner loading-md" aria-hidden="true" />
          Preparing your workspace
        </div>
      </main>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-base-200">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-base-100)',
              color: 'var(--color-base-content)',
              border: '1px solid var(--color-base-300)',
              borderRadius: '0.75rem',
              boxShadow: '0 12px 28px rgba(27, 39, 35, 0.12)',
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
