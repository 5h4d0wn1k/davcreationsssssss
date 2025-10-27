"use client";

import React from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    return {
      score: strength,
      checks,
      label: strength <= 2 ? "Weak" : strength <= 3 ? "Medium" : strength <= 4 ? "Strong" : "Very Strong",
      color: strength <= 2 ? "bg-red-500" : strength <= 3 ? "bg-yellow-500" : strength <= 4 ? "bg-blue-500" : "bg-green-500",
    };
  };

  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2 mb-1">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          ></div>
        </div>
        <span className={`text-xs font-medium ${strength.score <= 2 ? 'text-red-600' : strength.score <= 3 ? 'text-yellow-600' : strength.score <= 4 ? 'text-blue-600' : 'text-green-600'}`}>
          {strength.label}
        </span>
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <div className={`flex items-center ${strength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
          <span className="mr-1">{strength.checks.length ? '✓' : '○'}</span>
          At least 8 characters
        </div>
        <div className={`flex items-center ${strength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
          <span className="mr-1">{strength.checks.uppercase ? '✓' : '○'}</span>
          One uppercase letter
        </div>
        <div className={`flex items-center ${strength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
          <span className="mr-1">{strength.checks.lowercase ? '✓' : '○'}</span>
          One lowercase letter
        </div>
        <div className={`flex items-center ${strength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
          <span className="mr-1">{strength.checks.number ? '✓' : '○'}</span>
          One number
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;