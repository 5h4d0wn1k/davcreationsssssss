'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LoadingButton } from '../../components/LoadingSpinner';
import { Alert } from '../../components/FormError';
import { useAuth } from '../../components/AuthProvider';
import { authApi, handleApiError, getErrorType, isRecoverableError, isApiError } from '../../lib/api';
import { NetworkErrorFallback, RateLimitFallback } from '../../components/FallbackUI';
import {
  sanitizeEmail,
  sanitizeString,
  validateEmail,
  validatePassword,
  validateOTP,
  sanitizeOTP,
  hasSQLInjection,
  clientRateLimiter,
  checkBrowserSecurity,
  PasswordValidation
} from '../../lib/security';

interface FormErrors {
  email?: string;
  password?: string;
  otp?: string;
  general?: string;
}

interface ApiErrorState {
  type: 'network' | 'rate-limit' | 'server' | 'validation' | 'auth' | 'unknown';
  message: string;
  retryAfter?: number;
  canRetry: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login: authLogin } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'login' | 'otp'>('login');
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [apiError, setApiError] = useState<ApiErrorState | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordValidation['strength'] | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'success'>('email');
  const [forgotPasswordData, setForgotPasswordData] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [forgotPasswordErrors, setForgotPasswordErrors] = useState<{ email?: string; otp?: string; newPassword?: string; confirmPassword?: string }>({});
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);
  
  // Security state
  const [isOnline, setIsOnline] = useState(true);
  const [browserSecurityCheck, setBrowserSecurityCheck] = useState<ReturnType<typeof checkBrowserSecurity> | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Check browser security on mount
  useEffect(() => {
    const securityCheck = checkBrowserSecurity();
    setBrowserSecurityCheck(securityCheck);
    
    if (!securityCheck.cookiesEnabled) {
      setErrors({ general: 'Cookies must be enabled to sign in. Please enable cookies in your browser settings.' });
    }
  }, []);

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setApiError(null);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setApiError({
        type: 'network',
        message: 'No internet connection. Please check your network and try again.',
        canRetry: true
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Forgot password OTP resend countdown
  useEffect(() => {
    if (otpResendCountdown > 0) {
      const timer = setTimeout(() => setOtpResendCountdown(otpResendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendCountdown]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(lockoutTime - 1);
        if (lockoutTime - 1 === 0) {
          setIsLocked(false);
          setLoginAttempts(0);
          clientRateLimiter.clearAttempts('login');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  // Clear errors when switching steps
  useEffect(() => {
    setErrors({});
    setApiError(null);
  }, [step]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific errors
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setApiError(null);
    
    // Real-time password strength indicator
    if (name === 'password' && value) {
      const validation = validatePassword(value);
      setPasswordStrength(validation.strength);
    } else if (name === 'password') {
      setPasswordStrength(null);
    }
  }, [errors]);

  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeOTP(e.target.value);
    setOtp(value);
    
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: undefined }));
    }
    setApiError(null);
  }, [errors.otp]);

  const handleLoginSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    
    // Clear previous states
    setApiError(null);
    setMessage('');
    setErrors({});
    
    // Check browser security
    if (browserSecurityCheck && !browserSecurityCheck.cookiesEnabled) {
      setErrors({ general: 'Cookies must be enabled to sign in.' });
      return;
    }
    
    // Check if offline
    if (!isOnline) {
      setApiError({
        type: 'network',
        message: 'No internet connection. Please check your network and try again.',
        canRetry: true
      });
      return;
    }
    
    // Check if locked out
    if (isLocked) {
      setErrors({ 
        general: `Too many failed attempts. Please wait ${lockoutTime} seconds before trying again.` 
      });
      return;
    }
    
    // Client-side rate limiting
    if (clientRateLimiter.isRateLimited('login', 5, 60000)) {
      const timeUntilReset = Math.ceil(clientRateLimiter.getTimeUntilReset('login', 60000) / 1000);
      setIsLocked(true);
      setLockoutTime(timeUntilReset);
      setErrors({ 
        general: `Too many login attempts. Please wait ${timeUntilReset} seconds.` 
      });
      return;
    }
    
    const newErrors: FormErrors = {};
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(formData.email);
    const sanitizedPassword = sanitizeString(formData.password);
    
    // Validate email
    if (!sanitizedEmail) {
      newErrors.email = 'Email is required.';
    } else if (!validateEmail(sanitizedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    } else if (hasSQLInjection(sanitizedEmail)) {
      newErrors.email = 'Invalid characters detected in email.';
    }
    
    // Validate password
    if (!sanitizedPassword) {
      newErrors.password = 'Password is required.';
    } else {
      const passwordValidation = validatePassword(sanitizedPassword);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors?.[0] || passwordValidation.message || 'Invalid password.';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    clientRateLimiter.recordAttempt('login');
    
    try {
      await authApi.sendOtp({ 
        email: sanitizedEmail, 
        user_password: sanitizedPassword 
      });
      
      // Update form data with sanitized values
      setFormData({ email: sanitizedEmail, password: sanitizedPassword });
      setStep('otp');
      setMessage('Verification code sent to your email. Please check your inbox.');
      setResendCountdown(60);
      setLoginAttempts(0); // Reset on successful OTP send
      
    } catch (error: unknown) {
      console.error('Failed to send OTP:', error);
      
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      // Lock after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockoutTime(300); // 5 minutes lockout
        setErrors({ 
          general: 'Too many failed attempts. Your account has been temporarily locked for 5 minutes.' 
        });
        setLoading(false);
        return;
      }
      
      if (!isApiError(error)) {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
        setLoading(false);
        return;
      }
      
      const apiError = error;
      const errorType = getErrorType(apiError);
      const canRetry = isRecoverableError(apiError);
      const details = apiError.details as Record<string, unknown> | undefined;
      const retryAfter = details?.retryAfter ? Math.ceil((details.retryAfter as number) / 1000) : undefined;
      
      if (errorType === 'rate-limit') {
        setApiError({
          type: errorType,
          message: handleApiError(apiError),
          retryAfter,
          canRetry,
        });
      } else if (errorType === 'auth') {
        setErrors({ 
          general: `Invalid email or password. ${5 - newAttempts} attempts remaining.` 
        });
      } else if (errorType === 'network') {
        setApiError({
          type: errorType,
          message: handleApiError(apiError),
          retryAfter,
          canRetry,
        });
      } else {
        setErrors({ general: handleApiError(apiError) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    
    // Clear previous states
    setApiError(null);
    setMessage('');
    setErrors({});
    
    // Check if offline
    if (!isOnline) {
      setApiError({
        type: 'network',
        message: 'No internet connection. Please check your network and try again.',
        canRetry: true
      });
      return;
    }
    
    // Validate OTP
    const otpValidation = validateOTP(otp, 4);
    if (!otpValidation.isValid) {
      setErrors({ otp: otpValidation.error });
      return;
    }
    
    setLoading(true);
    
    try {
      // Call login with credentials and OTP - this creates the session
      await authLogin(formData.email, formData.password, otp);
      
      setMessage('Login successful! Redirecting...');
      
      // Clear rate limiting on successful login
      clientRateLimiter.clearAttempts('login');
      setLoginAttempts(0);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1000);
      
    } catch (error: unknown) {
      console.error('OTP verification or login failed:', error);
      
      if (!isApiError(error)) {
        setErrors({ otp: 'An unexpected error occurred. Please try again.' });
        setLoading(false);
        return;
      }
      
      const apiError = error;
      const errorType = getErrorType(apiError);
      const canRetry = isRecoverableError(apiError);
      const details = apiError.details as Record<string, unknown> | undefined;
      const retryAfter = details?.retryAfter ? Math.ceil((details.retryAfter as number) / 1000) : undefined;
      
      if (errorType === 'rate-limit') {
        setApiError({
          type: errorType,
          message: handleApiError(apiError),
          retryAfter,
          canRetry,
        });
      } else if (errorType === 'auth') {
        setErrors({ otp: 'Invalid or expired verification code. Please try again.' });
      } else if (errorType === 'network') {
        setApiError({
          type: errorType,
          message: handleApiError(apiError),
          retryAfter,
          canRetry,
        });
      } else {
        setErrors({ otp: handleApiError(apiError) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    
    setApiError(null);
    setMessage('');
    setErrors({});
    setLoading(true);
    
    try {
      await authApi.sendOtp({ 
        email: formData.email, 
        user_password: formData.password 
      });
      
      setMessage('New verification code sent to your email.');
      setResendCountdown(60);
      setOtp('');
      
    } catch (error: unknown) {
      console.error('Failed to resend OTP:', error);
      
      if (!isApiError(error)) {
        setErrors({ otp: 'Failed to resend code. Please try again.' });
        setLoading(false);
        return;
      }
      
      const apiError = error;
      const errorType = getErrorType(apiError);
      const canRetry = isRecoverableError(apiError);
      const details = apiError.details as Record<string, unknown> | undefined;
      const retryAfter = details?.retryAfter ? Math.ceil((details.retryAfter as number) / 1000) : undefined;
      
      if (errorType === 'rate-limit') {
        setApiError({
          type: errorType,
          message: handleApiError(apiError),
          retryAfter,
          canRetry,
        });
      } else {
        setErrors({ otp: handleApiError(apiError) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setApiError(null);
    if (step === 'login') {
      handleLoginSubmit();
    } else {
      handleOtpSubmit();
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
    setOtp('');
    setErrors({});
    setMessage('');
    setApiError(null);
    setResendCountdown(0);
    setPasswordStrength(null);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  // Forgot Password Handlers
  const handleForgotPasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({ ...prev, [name]: value }));
    if (forgotPasswordErrors[name as keyof typeof forgotPasswordErrors]) {
      setForgotPasswordErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSendPasswordResetOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordErrors({});
    setForgotPasswordMessage('');

    // Validate email
    const sanitizedEmail = sanitizeEmail(forgotPasswordData.email);
    if (!sanitizedEmail) {
      setForgotPasswordErrors({ email: 'Email is required.' });
      return;
    }
    if (!validateEmail(sanitizedEmail)) {
      setForgotPasswordErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    setForgotPasswordLoading(true);

    try {
      console.log('Proceeding to password reset for email:', sanitizedEmail);
      setForgotPasswordMessage('Enter the OTP from your previous login attempt and your new password. If you haven\'t received an OTP, please contact your administrator.');
      setForgotPasswordData(prev => ({ ...prev, email: sanitizedEmail }));
      setForgotPasswordStep('otp');
      setOtpResendCountdown(60);
    } catch (error: unknown) {
      console.error('Unexpected error:', error);
      setForgotPasswordErrors({ email: 'An unexpected error occurred. Please try again.' });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendPasswordResetOTP = async () => {
    if (otpResendCountdown > 0 || forgotPasswordLoading) return;

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      console.log('Note: Backend requires password for OTP, which is not available in forgot password flow');
      setForgotPasswordMessage('If you need a new OTP, please contact your administrator.');
      setOtpResendCountdown(60);
    } catch (error: unknown) {
      setForgotPasswordMessage('If you need a new OTP, please contact your administrator.');
      setOtpResendCountdown(60);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordErrors({});
    setForgotPasswordMessage('');

    const newErrors: typeof forgotPasswordErrors = {};

    // Validate OTP
    const otpValidation = validateOTP(forgotPasswordData.otp, 4);
    if (!otpValidation.isValid) {
      newErrors.otp = otpValidation.error;
    }

    // Validate new password
    const passwordValidation = validatePassword(forgotPasswordData.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.errors?.[0] || passwordValidation.message || 'Invalid password.';
    }

    // Validate confirm password
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setForgotPasswordErrors(newErrors);
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await authApi.forgotPassword({
        email: forgotPasswordData.email,
        newPassword: forgotPasswordData.newPassword,
        otp: forgotPasswordData.otp
      });

      setForgotPasswordMessage('Password reset successfully! Redirecting to login...');
      setForgotPasswordStep('success');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        handleCloseForgotPassword();
      }, 2000);
    } catch (error: unknown) {
      if (!isApiError(error)) {
        setForgotPasswordErrors({ newPassword: 'An unexpected error occurred. Please try again.' });
        setForgotPasswordLoading(false);
        return;
      }

      const apiError = error;
      const errorType = getErrorType(apiError);
      
      if (errorType === 'auth') {
        setForgotPasswordErrors({ otp: 'Invalid or expired verification code. Please try again.' });
      } else if (errorType === 'validation') {
        setForgotPasswordErrors({ newPassword: handleApiError(apiError) });
      } else {
        setForgotPasswordErrors({ newPassword: handleApiError(apiError) });
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotPasswordData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
    setForgotPasswordErrors({});
    setForgotPasswordMessage('');
    setForgotPasswordLoading(false);
    setOtpResendCountdown(0);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 blur-bg">
        <div className="absolute top-0 left-0 w-full h-full gradient-bg opacity-80"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728" />
            </svg>
            <span className="text-sm font-medium">You are offline</span>
          </div>
        </div>
      )}

      {/* Theme toggle positioned at top right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md fade-in">
          {/* Glassmorphism card */}
          <div className="glass-enhanced rounded-3xl p-8 md:p-10 shadow-2xl">
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
                SuperAdmin
              </h1>
              <p className="text-sm text-muted mb-2">
                by DAV Creations
              </p>
              <p className="text-sm text-muted">
                {step === 'login' 
                  ? 'Welcome back! Please sign in to your account' 
                  : 'Enter the verification code sent to your email'}
              </p>
            </div>

            {/* General errors */}
            {errors.general && (
              <Alert
                type="error"
                message={errors.general}
                className="mb-6"
                onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
              />
            )}

            {/* Status message */}
            {message && (
              <Alert
                type="success"
                message={message}
                className="mb-6"
                onDismiss={() => setMessage('')}
              />
            )}

            {/* API Error Handling */}
            {apiError && (
              <div className="mb-6">
                {apiError.type === 'network' && (
                  <NetworkErrorFallback onRetry={apiError.canRetry ? handleRetry : undefined} />
                )}
                {apiError.type === 'rate-limit' && (
                  <RateLimitFallback
                    retryAfter={apiError.retryAfter}
                    onRetry={apiError.canRetry && (!apiError.retryAfter || apiError.retryAfter <= 0) ? handleRetry : undefined}
                  />
                )}
                {(apiError.type === 'server' || apiError.type === 'auth' || apiError.type === 'validation' || apiError.type === 'unknown') && (
                  <Alert
                    type={apiError.type === 'validation' ? 'warning' : 'error'}
                    title={
                      apiError.type === 'auth' ? 'Authentication Error' :
                      apiError.type === 'validation' ? 'Validation Error' :
                      apiError.type === 'server' ? 'Server Error' : 'Error'
                    }
                    message={apiError.message}
                    onDismiss={() => setApiError(null)}
                  />
                )}
              </div>
            )}

            {/* Login form */}
            {step === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6" noValidate>
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
                      disabled={loading || isLocked}
                      autoComplete="email"
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      maxLength={254}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                  {errors.email && (
                    <div className="mt-2" id="email-error">
                      <Alert type="error" message={errors.email} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted focus-ring"
                      placeholder="Enter your password"
                      required
                      disabled={loading || isLocked}
                      autoComplete="current-password"
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
                      disabled={loading || isLocked}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {passwordStrength && formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ 
                              width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' 
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted capitalize">{passwordStrength}</span>
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <div className="mt-2" id="password-error">
                      <Alert type="error" message={errors.password} />
                    </div>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Sending code..."
                  disabled={loading || isLocked || !isOnline}
                  className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isLocked ? `Locked (${lockoutTime}s)` : 'Sign In'}
                </LoadingButton>

                {/* Forgot Password Link */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={loading}
                    className="text-sm text-primary hover:text-primary-hover font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            ) : (
              /* OTP form */
              <form onSubmit={handleOtpSubmit} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-sm font-semibold text-foreground">
                    Verification Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={handleOtpChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted text-center text-lg tracking-widest focus-ring"
                      placeholder="0000"
                      maxLength={4}
                      pattern="\d{4}"
                      inputMode="numeric"
                      required
                      disabled={loading}
                      autoComplete="one-time-code"
                      aria-describedby={errors.otp ? 'otp-error' : undefined}
                      aria-invalid={errors.otp ? 'true' : 'false'}
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  {errors.otp && (
                    <div className="mt-2" id="otp-error">
                      <Alert type="error" message={errors.otp} />
                    </div>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Verifying..."
                  disabled={loading || otp.length !== 4 || !isOnline}
                  className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Verify Code
                </LoadingButton>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendCountdown > 0}
                    className="text-sm text-primary hover:text-primary-hover font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCountdown > 0 
                      ? `Resend code in ${resendCountdown}s` 
                      : 'Resend verification code'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  disabled={loading}
                  className="w-full text-primary hover:text-primary-hover text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Sign In</span>
                </button>
              </form>
            )}
          </div>

          {/* Footer branding */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted">
              Powered by{' '}
              <span className="font-semibold text-primary">DAV Creations</span>
            </p>
            {browserSecurityCheck && !browserSecurityCheck.httpsOnly && (
              <p className="text-xs text-orange-500 mt-2">
                ⚠️ Unsecured connection detected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal - Self-Service OTP Flow */}
      {showForgotPassword && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
          onClick={handleCloseForgotPassword}
        >
          <div 
            className="glass-enhanced rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step 1: Email Entry */}
            {forgotPasswordStep === 'email' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Reset Your Password
                  </h2>
                  <p className="text-muted text-sm">
                    Enter your email to receive a verification code
                  </p>
                </div>

                {forgotPasswordMessage && (
                  <Alert
                    type="info"
                    message={forgotPasswordMessage}
                    className="mb-4"
                    onDismiss={() => setForgotPasswordMessage('')}
                  />
                )}

                <form onSubmit={handleSendPasswordResetOTP} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="forgot-email" className="block text-sm font-semibold text-foreground">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="forgot-email"
                      name="email"
                      value={forgotPasswordData.email}
                      onChange={handleForgotPasswordInputChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted"
                      placeholder="Enter your email"
                      required
                      disabled={forgotPasswordLoading}
                      autoComplete="email"
                      autoFocus
                    />
                    {forgotPasswordErrors.email && (
                      <Alert type="error" message={forgotPasswordErrors.email} />
                    )}
                  </div>

                  <LoadingButton
                    type="submit"
                    loading={forgotPasswordLoading}
                    loadingText="Sending code..."
                    disabled={forgotPasswordLoading}
                    className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Send Verification Code
                  </LoadingButton>

                  <button
                    type="button"
                    onClick={handleCloseForgotPassword}
                    className="w-full text-muted hover:text-foreground text-sm font-medium transition-colors duration-200"
                  >
                    Back to Sign In
                  </button>
                </form>
              </>
            )}

            {/* Step 2: OTP & New Password */}
            {forgotPasswordStep === 'otp' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Create New Password
                  </h2>
                  <p className="text-muted text-sm">
                    Enter the verification code and your new password
                  </p>
                  <p className="text-xs text-muted mt-2">
                    Code sent to: <span className="font-semibold text-foreground">{forgotPasswordData.email}</span>
                  </p>
                </div>

                {forgotPasswordMessage && (
                  <Alert
                    type="success"
                    message={forgotPasswordMessage}
                    className="mb-4"
                    onDismiss={() => setForgotPasswordMessage('')}
                  />
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="forgot-otp" className="block text-sm font-semibold text-foreground">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="forgot-otp"
                      name="otp"
                      value={forgotPasswordData.otp}
                      onChange={(e) => {
                        const value = sanitizeOTP(e.target.value);
                        setForgotPasswordData(prev => ({ ...prev, otp: value }));
                        if (forgotPasswordErrors.otp) {
                          setForgotPasswordErrors(prev => ({ ...prev, otp: undefined }));
                        }
                      }}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted text-center text-lg tracking-widest"
                      placeholder="0000"
                      maxLength={4}
                      inputMode="numeric"
                      required
                      disabled={forgotPasswordLoading}
                      autoFocus
                    />
                    {forgotPasswordErrors.otp && (
                      <Alert type="error" message={forgotPasswordErrors.otp} />
                    )}
                    <div className="text-center mt-2">
                      <button
                        type="button"
                        onClick={handleResendPasswordResetOTP}
                        disabled={otpResendCountdown > 0 || forgotPasswordLoading}
                        className="text-sm text-primary hover:text-primary-hover font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpResendCountdown > 0 
                          ? `Resend code in ${otpResendCountdown}s` 
                          : 'Resend verification code'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="forgot-new-password" className="block text-sm font-semibold text-foreground">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="forgot-new-password"
                      name="newPassword"
                      value={forgotPasswordData.newPassword}
                      onChange={handleForgotPasswordInputChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted"
                      placeholder="Enter new password"
                      required
                      disabled={forgotPasswordLoading}
                      minLength={8}
                    />
                    {forgotPasswordErrors.newPassword && (
                      <Alert type="error" message={forgotPasswordErrors.newPassword} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="forgot-confirm-password" className="block text-sm font-semibold text-foreground">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="forgot-confirm-password"
                      name="confirmPassword"
                      value={forgotPasswordData.confirmPassword}
                      onChange={handleForgotPasswordInputChange}
                      className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 backdrop-blur-sm text-foreground placeholder-muted"
                      placeholder="Confirm new password"
                      required
                      disabled={forgotPasswordLoading}
                      minLength={8}
                    />
                    {forgotPasswordErrors.confirmPassword && (
                      <Alert type="error" message={forgotPasswordErrors.confirmPassword} />
                    )}
                  </div>

                  <LoadingButton
                    type="submit"
                    loading={forgotPasswordLoading}
                    loadingText="Resetting password..."
                    disabled={forgotPasswordLoading}
                    className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Reset Password
                  </LoadingButton>

                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep('email')}
                    disabled={forgotPasswordLoading}
                    className="w-full text-muted hover:text-foreground text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Success */}
            {forgotPasswordStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Password Reset Successfully!
                </h2>
                <p className="text-muted text-sm mb-6">
                  Your password has been reset. You can now sign in with your new password.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-muted">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Redirecting to login...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
