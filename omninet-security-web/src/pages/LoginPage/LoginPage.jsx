import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  BoltIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const { login, loginWithEmail, clearError, error: storeError } = useAuthStore();
  const hasError = searchParams.get('error') === 'true';

  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hasError) {
      toast.error('Authentication failed. Please try again.');
    }
    return () => clearError();
  }, [hasError, clearError]);

  const handleOAuthLogin = (provider) => {
    login(provider);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!emailData.email || !emailData.password) return;

    setIsLoading(true);
    try {
      await loginWithEmail(emailData);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-200 text-base-content flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-primary/20">
      {/* Soft background ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

      {/* Auth Card */}
      <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-xl p-7 sm:p-9 relative animate-fade-in">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <Link
            to="/landing_page"
            className="inline-grid size-12 place-items-center rounded-2xl bg-neutral text-neutral-content mx-auto mb-3.5 shadow-sm hover:opacity-90 transition-opacity"
            title="Go to home"
          >
            <BoltIcon className="size-6" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Welcome to OmniNet
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            {showEmailLogin
              ? 'Enter your email credentials to access your workspace'
              : 'Sign in to access your secure workspace'}
          </p>
        </div>

        {/* Global Error Banner */}
        {(hasError || storeError) && (
          <div className="alert alert-error text-xs rounded-xl py-2.5 px-3.5 mb-5 font-medium flex items-center gap-2">
            <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
            <span>{storeError || 'Authentication failed. Please verify your credentials.'}</span>
          </div>
        )}

        {/* Form area */}
        {showEmailLogin ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5" htmlFor="login-email">
                Email address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  className="input input-bordered input-sm w-full pl-10 bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={emailData.password}
                  onChange={(e) => setEmailData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input input-bordered input-sm w-full pl-10 bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !emailData.email || !emailData.password}
              className="btn btn-primary btn-sm w-full rounded-xl text-xs font-semibold shadow-xs mt-2"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmailLogin(false);
                  clearError();
                }}
                className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content gap-1.5"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Back to other options</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {/* Sign in with Email */}
            <button
              type="button"
              onClick={() => setShowEmailLogin(true)}
              className="btn btn-primary btn-sm w-full rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2"
            >
              <EnvelopeIcon className="w-4 h-4" />
              <span>Sign in with Email</span>
            </button>

            {/* Divider */}
            <div className="divider text-[11px] uppercase tracking-wider text-base-content/40 my-3">
              or continue with
            </div>

            {/* GitHub Button */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              className="btn btn-outline border-base-300 hover:bg-base-200 hover:border-base-300 hover:text-base-content btn-sm w-full rounded-xl text-xs font-medium flex items-center justify-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Sign in with GitHub</span>
            </button>

            {/* Google Button */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="btn btn-outline border-base-300 hover:bg-base-200 hover:border-base-300 hover:text-base-content btn-sm w-full rounded-xl text-xs font-medium flex items-center justify-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center mt-6 pt-5 border-t border-base-300/80">
          <p className="text-xs text-base-content/60">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
          <p className="text-[11px] text-base-content/40 mt-3 leading-relaxed">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>

      {/* Return to home link */}
      <div className="mt-4">
        <Link
          to="/landing_page"
          className="text-xs text-base-content/50 hover:text-base-content transition-colors inline-flex items-center gap-1"
        >
          ← Back to OmniNet overview
        </Link>
      </div>
    </main>
  );
};

export default LoginPage;