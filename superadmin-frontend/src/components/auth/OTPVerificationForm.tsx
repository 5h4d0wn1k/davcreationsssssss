"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function OTPVerificationForm() {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyOtp, sendOtp, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setIsSubmitting(true);
    clearError();

    try {
      await verifyOtp({ email, otp });
      router.push('/admin'); // Redirect to dashboard after successful verification
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
              Verify OTP
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the OTP sent to your email to complete verification.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
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
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            </div>
          </form>

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
        </div>
      </div>
    </div>
  );
}