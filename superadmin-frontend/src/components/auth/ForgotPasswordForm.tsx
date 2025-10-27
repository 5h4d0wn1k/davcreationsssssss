"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { forgotPassword, sendOtp, error, clearError } = useAuth();
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    clearError();

    try {
      await sendOtp({ email });
      setStep('otp');
    } catch {
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) return;

    setIsSubmitting(true);
    clearError();

    try {
      await forgotPassword({ email, otp, newPassword });
      alert('Password reset successfully');
      router.push('/signin');
    } catch {
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;

    try {
      await sendOtp({ email });
      alert('OTP sent successfully');
    } catch {
      // Error is handled by the context
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 'email'
                ? 'Enter your email address to receive a reset code.'
                : 'Enter the OTP and your new password.'
              }
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-error-500">
                    {error}
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="space-y-6">
                <div>
                  <Label>
                    OTP Code <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-error-500">
                    {error}
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={isSubmitting || otp.length !== 6 || !newPassword.trim()}
                  >
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn&apos;t receive the OTP?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}