import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  BoltIcon,
  EnvelopeIcon,
  UserIcon,
  LockClosedIcon,
  KeyIcon,
  ArrowLeftIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const EmailRegistrationPage = () => {
  const navigate = useNavigate();
  const {
    initiateEmailRegistration,
    verifyEmailOtp,
    completeEmailRegistration,
    resendOtp,
    checkEmail,
    error: storeError,
    clearError,
  } = useAuthStore();

  const [step, setStep] = useState('initial'); // 'initial' | 'otp' | 'password'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [data, setData] = useState({
    email: '',
    name: '',
    otpCode: '',
    password: '',
    confirmPassword: '',
    verificationToken: '',
  });

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!data.email || !data.name) return;

    setIsSubmitting(true);
    clearError();

    try {
      const emailCheck = await checkEmail(data.email);

      if (!emailCheck.available) {
        toast.error('An account with this email already exists. Please sign in instead.');
        setIsSubmitting(false);
        return;
      }

      const response = await initiateEmailRegistration({
        email: data.email,
        name: data.name,
      });

      if (response.success) {
        toast.success('Verification code sent to your email.');
        setStep('otp');
      }
    } catch (error) {
      console.error('Registration initiation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to start registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!data.otpCode) return;

    setIsSubmitting(true);
    clearError();

    try {
      const response = await verifyEmailOtp({
        email: data.email,
        otpCode: data.otpCode,
      });

      if (response.success) {
        setData((prev) => ({
          ...prev,
          verificationToken: response.verificationToken,
        }));
        setStep('password');
        toast.success('Email verified successfully!');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      let errorMessage = 'Invalid verification code';

      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!data.password || !data.confirmPassword) return;

    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (data.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const response = await completeEmailRegistration({
        email: data.email,
        name: data.name,
        password: data.password,
        verificationToken: data.verificationToken,
      });

      if (response.success) {
        toast.success('Account created successfully! Please sign in.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration completion failed:', error);
      toast.error(error.response?.data?.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      await resendOtp(data.email);
      toast.success('New verification code sent to your email.');
    } catch (error) {
      toast.error('Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-200 text-base-content flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-primary/20">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl shadow-xl p-7 sm:p-9 relative animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <Link
            to="/landing_page"
            className="inline-grid size-12 place-items-center rounded-2xl bg-neutral text-neutral-content mx-auto mb-3.5 shadow-sm hover:opacity-90 transition-opacity"
            title="Go to home"
          >
            <BoltIcon className="size-6" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            {step === 'initial'
              ? 'Create your workspace'
              : step === 'otp'
              ? 'Verify your email'
              : 'Set your password'}
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            {step === 'initial'
              ? 'Enter your details to register a new account'
              : step === 'otp'
              ? `We sent a 6-digit verification code to ${data.email}`
              : 'Choose a secure password for your OmniNet account'}
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between mb-6 px-2">
          {['Details', 'Verify', 'Security'].map((label, idx) => {
            const currentIdx = step === 'initial' ? 0 : step === 'otp' ? 1 : 2;
            const isDone = currentIdx > idx;
            const isCurrent = currentIdx === idx;

            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isDone
                      ? 'bg-success text-success-content'
                      : isCurrent
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 text-base-content/40 border border-base-300'
                  }`}
                >
                  {isDone ? <CheckIcon className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span
                  className={`text-xs ${
                    isCurrent ? 'font-semibold text-base-content' : 'text-base-content/50'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {storeError && (
          <div className="alert alert-error text-xs rounded-xl py-2.5 px-3.5 mb-5 font-medium">
            <span>{storeError}</span>
          </div>
        )}

        {/* STEP 1: INITIAL FORM */}
        {step === 'initial' && (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5" htmlFor="reg-name">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={data.name}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Surendra Singh"
                  className="input input-bordered input-sm w-full pl-10 bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5" htmlFor="reg-email">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={data.email}
                  onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  className="input input-bordered input-sm w-full pl-10 bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !data.email || !data.name}
              className="btn btn-primary btn-sm w-full rounded-xl text-xs font-semibold shadow-xs mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Sending verification code...</span>
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5" htmlFor="reg-otp">
                Verification Code
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="reg-otp"
                  type="text"
                  required
                  maxLength={6}
                  value={data.otpCode}
                  onChange={(e) => setData((prev) => ({ ...prev, otpCode: e.target.value.trim() }))}
                  placeholder="6-digit code"
                  className="input input-bordered input-sm w-full pl-10 tracking-widest text-center font-mono font-bold bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/30 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || data.otpCode.length < 4}
              className="btn btn-primary btn-sm w-full rounded-xl text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('initial')}
                className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content gap-1"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Change email</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="btn btn-ghost btn-xs text-primary font-medium gap-1"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Sending...' : 'Resend code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SET PASSWORD */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5" htmlFor="reg-pwd">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="reg-pwd"
                  type="password"
                  required
                  minLength={8}
                  value={data.password}
                  onChange={(e) => setData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input input-bordered input-sm w-full pl-10 bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-base-content/80 mb-1.5" htmlFor="reg-confirm-pwd">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="reg-confirm-pwd"
                  type="password"
                  required
                  minLength={8}
                  value={data.confirmPassword}
                  onChange={(e) => setData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className={`input input-bordered input-sm w-full pl-10 bg-base-100 border-base-300 rounded-xl text-base-content placeholder:text-base-content/40 focus:border-primary ${
                    data.confirmPassword && data.password !== data.confirmPassword
                      ? 'border-error focus:border-error'
                      : ''
                  }`}
                />
              </div>
              {data.confirmPassword && data.password !== data.confirmPassword && (
                <span className="text-[11px] text-error mt-1 block">Passwords do not match</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !data.password || !data.confirmPassword || data.password !== data.confirmPassword}
              className="btn btn-primary btn-sm w-full rounded-xl text-xs font-semibold shadow-xs mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="text-center mt-6 pt-5 border-t border-base-300/80">
          <p className="text-xs text-base-content/60">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
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

export default EmailRegistrationPage;