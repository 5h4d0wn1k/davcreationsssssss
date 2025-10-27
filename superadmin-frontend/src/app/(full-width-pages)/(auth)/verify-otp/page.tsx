import OTPVerificationForm from "@/components/auth/OTPVerificationForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Next.js Verify OTP Page | davcreations - Next.js Dashboard Template",
  description: "This is Next.js Verify OTP Page davcreations Dashboard Template",
};

export default function VerifyOTP() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPVerificationForm />
    </Suspense>
  );
}