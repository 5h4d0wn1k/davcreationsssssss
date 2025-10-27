"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "@/services/utils/validationSchemas";

interface SignInFormData {
  email: string;
  password: string;
  otp: string;
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login, sendOtp, error, clearError } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm<SignInFormData>({
    resolver: yupResolver(loginSchema),
  });

  const emailValue = watch('email');

  // Safeguard to reset isSubmitting if it gets stuck
  useEffect(() => {
    if (isSubmitting) {
      const timeout = setTimeout(() => {
        setIsSubmitting(false);
      }, 10000); // Reset after 10 seconds
      return () => clearTimeout(timeout);
    }
  }, [isSubmitting]);

  const handleSendOtp = async () => {
    console.log('handleSendOtp called, emailValue:', emailValue);
    if (!emailValue?.trim()) {
      console.log('handleSendOtp: email not provided, returning');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setError('email', { message: 'Invalid email format' });
      return;
    }

    setIsSubmitting(true);
    clearError();
    clearErrors();

    try {
      await sendOtp({ email: emailValue });
      setOtpSent(true);
      // Show success message instead of alert
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError('email', { message: err.message || 'Failed to send OTP' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: SignInFormData) => {
    if (!otpSent) {
      setError('otp', { message: 'Please send OTP first' });
      return;
    }

    setIsSubmitting(true);
    clearError();
    clearErrors();

    try {
      await login(data);
      router.push('/');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError('root', { message: err.message || 'Login failed' });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email, send OTP, then enter OTP and password to sign in!
            </p>
          </div>
          <div>
            {/* Google OAuth removed as per user instruction */}
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} data-testid="signin-form">
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    type="email"
                    data-testid="email-input"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                {/* Send OTP Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    data-testid="send-otp-button"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-blue-500 shadow-theme-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!emailValue?.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      data-testid="password-input"
                      {...register('password')}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <Label>
                    OTP <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    data-testid="otp-input"
                    {...register('otp')}
                    maxLength={6}
                  />
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                {error && (
                  <div className="text-sm text-error-500">
                    {error}
                  </div>
                )}
                {errors.root && (
                  <div className="text-sm text-error-500">
                    {errors.root.message}
                  </div>
                )}
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    data-testid="signin-button"
                    disabled={isSubmitting || !otpSent}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
