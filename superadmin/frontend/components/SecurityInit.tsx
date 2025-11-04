"use client";

import { useEffect } from "react";
import { initializeSecurity } from "../lib/security";

/**
 * SecurityInit Component
 * Runs security checks on app initialization
 * - HTTPS enforcement
 * - Cookie security validation
 * - Clickjacking prevention
 */
export const SecurityInit: React.FC = () => {
  useEffect(() => {
    // Run security checks on mount (client-side only)
    initializeSecurity();
  }, []);

  // This component doesn't render anything
  return null;
};
