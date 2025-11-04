'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LoadingButton } from '../../components/LoadingSpinner';
import { Alert } from '../../components/FormError';
import { authApi, handleApiError, type SendOtpRequest } from '../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [errors, setErrors] = useState<{ email?: string; otp?: string; newPassword?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('ForgotPasswordPage: Proceeding to password reset for email:', formData.email);
      setStep('reset');
      setMessage('Enter the OTP from your previous login attempt along with your new password. If you haven\'t received an OTP, please contact your administrator.');
      setCountdown(60);
    } catch (error: unknown) {
      console.error('ForgotPasswordPage: Unexpected error:', error);
      setErrors({ email: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };



  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!formData.otp || formData.otp.length !== 4 || !/^\d{4}$/.test(formData.otp)) {
      newErrors.otp = 'Please enter a valid 4-digit OTP.';
    }

    if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = 'Password must be at least 8 characters long.';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setResetLoading(true);
    setMessage('');

    try {
      console.log('ForgotPasswordPage: Resetting password for email:', formData.email);
      await authApi.forgotPassword({
        email: formData.email,
        newPassword: formData.newPassword,
        otp: formData.otp
      });
      console.log('ForgotPasswordPage: Password reset successfully');
      setMessage('Password reset successful! Redirecting to login...');

      // Redirect to login after successful reset
      setTimeout(() => {
        console.log('ForgotPasswordPage: Redirecting to login');
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('ForgotPasswordPage: Password reset failed:', error);
      setErrors({ newPassword: handleApiError(error) });
    } finally {
      setResetLoading(false);
    }
  };



  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 blur-bg">
        <div className="absolute top-0 left-0 w-full h-full gradient-bg opacity-80"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Theme toggle positioned at top right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md fade-in">
          {/* Glassmorphism card */}
          <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl">
            {/* Logo and branding */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                  <Image
                    src="/superadmin/images/logos/square-logo.jpg"
                    alt="DAV Creations Logo"
                    fill
                    className="object-contain rounded-xl"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
                Reset Password
              </h1>
              <p className="text-sm text-muted">
                {step === 'email' && 'Enter your email to begin password reset'}
                {step === 'reset' && 'Enter your OTP and create your new password'}
              </p>
            </div>

            {/* Status message */}
            {message && (
              <Alert
                type="success"
                message={message}
                className="mb-6"
                onDismiss={() => setMessage('')}
              />
            )}

            {/* Email form */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted focus-ring"
                      placeholder="Enter your email"
                      required
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                  {errors.email && (
                    <div className="mt-2">
                      <Alert type="error" message={errors.email} />
                    </div>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Sending..."
                  className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Send Reset Code
                </LoadingButton>
              </form>
            )}

            {/* Reset password form */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-sm font-semibold text-foreground">
                    Verification Code (OTP)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted text-center text-lg tracking-widest focus-ring"
                      placeholder="0000"
                      maxLength={4}
                      pattern="\d{4}"
                      inputMode="numeric"
                      required
                      aria-describedby={errors.otp ? 'otp-error' : undefined}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  {errors.otp && (
                    <div className="mt-2">
                      <Alert type="error" message={errors.otp} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted focus-ring"
                      placeholder="Enter new password"
                      required
                      aria-describedby={errors.newPassword ? 'password-error' : undefined}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  {errors.newPassword && (
                    <div className="mt-2">
                      <Alert type="error" message={errors.newPassword} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted focus-ring"
                      placeholder="Confirm new password"
                      required
                      aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <div className="mt-2">
                      <Alert type="error" message={errors.confirmPassword} />
                    </div>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  loading={resetLoading}
                  loadingText="Resetting..."
                  className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Reset Password
                </LoadingButton>
              </form>
            )}

            {/* Back to login link */}
            <div className="text-center mt-6">
              <Link
                href="/login"
                className="text-primary hover:text-primary-hover text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>

          {/* Footer branding */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted">
              Powered by{' '}
              <span className="font-semibold text-primary">DAV Creations</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}