/**
 * Security Utilities for XSS Prevention and Input Sanitization
 * 
 * ⚠️ CRITICAL: These utilities provide frontend defense-in-depth
 * Backend MUST still validate and sanitize all inputs
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export const sanitizeHTML = (html: string): string => {
  // Create a temporary div to parse HTML
  const temp = document.createElement("div");
  temp.textContent = html; // textContent automatically escapes HTML
  return temp.innerHTML;
};

/**
 * Escape HTML special characters
 * Use this when displaying user-generated content
 */
export const escapeHTML = (str: string): string => {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
};

/**
 * Sanitize user input for safe display
 * Removes control characters and trims whitespace
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .replace(/\s+/g, " "); // Normalize whitespace
};

/**
 * Validate and sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Validate and sanitize URL
 * Only allows http, https, and mailto protocols
 */
export const sanitizeURL = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ["http:", "https:", "mailto:"];
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      console.warn(`Blocked unsafe URL protocol: ${parsed.protocol}`);
      return null;
    }
    
    return parsed.toString();
  } catch {
    console.warn(`Invalid URL: ${url}`);
    return null;
  }
};

/**
 * Remove script tags from string
 */
export const removeScriptTags = (str: string): string => {
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
};

/**
 * Validate that a string doesn't contain SQL injection patterns
 * This is a basic check - backend MUST use parameterized queries
 */
export const detectSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i,
    /('|")\s*(OR|AND)\s*('|")\s*=\s*('|")/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * Validate input against XSS patterns
 */
export const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /eval\(/i,
    /expression\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
};

/**
 * Sanitize object properties recursively
 * Useful for sanitizing form data before sending to API
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = {} as T;

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === "string") {
        sanitized[key] = sanitizeInput(value) as any;
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item: any) =>
          typeof item === "string"
            ? sanitizeInput(item)
            : typeof item === "object" && item !== null
            ? sanitizeObject(item)
            : item
        ) as any;
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

/**
 * Validate form field against common attack patterns
 * Returns { isValid: boolean, message?: string }
 */
export const validateField = (
  value: string,
  fieldName: string
): { isValid: boolean; message?: string } => {
  // Check for XSS patterns
  if (detectXSS(value)) {
    return {
      isValid: false,
      message: `${fieldName} contains potentially unsafe content`,
    };
  }

  // Check for SQL injection patterns
  if (detectSQLInjection(value)) {
    return {
      isValid: false,
      message: `${fieldName} contains invalid characters`,
    };
  }

  return { isValid: true };
};

/**
 * HTTPS enforcement check
 * Warns if app is not served over HTTPS in production
 */
export const enforceHTTPS = (): boolean => {
  if (typeof window === "undefined") return true; // SSR

  const isHTTPS = window.location.protocol === "https:";
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]";

  // Allow HTTP on localhost for development
  if (isLocalhost) return true;

  // In production, require HTTPS
  if (!isHTTPS && process.env.NODE_ENV === "production") {
    console.error(
      "⚠️ SECURITY WARNING: Application is not served over HTTPS in production!"
    );
    return false;
  }

  return true;
};

/**
 * Check if cookies are properly configured
 * Backend sets cookies with httpOnly, secure, sameSite flags
 */
export const checkCookieSecurity = (): void => {
  if (typeof document === "undefined") return; // SSR

  const cookies = document.cookie;
  
  // In production over HTTP, warn about insecure cookies
  if (
    process.env.NODE_ENV === "production" &&
    window.location.protocol !== "https:" &&
    cookies.includes("sid")
  ) {
    console.warn(
      "⚠️ SECURITY WARNING: Session cookies set over insecure connection (HTTP)"
    );
  }
};

/**
 * Generate a random CSRF token (if needed for future implementation)
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * Safe JSON parse with fallback
 */
export const safeJSONParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Prevent clickjacking by checking if app is in iframe
 */
export const preventClickjacking = (): void => {
  if (typeof window === "undefined") return; // SSR

  if (window.self !== window.top) {
    console.warn("⚠️ SECURITY WARNING: Application loaded in iframe");
    // Optionally break out of iframe:
    // window.top.location = window.self.location;
  }
};

/**
 * Initialize all security checks on app startup
 */
export const initializeSecurity = (): void => {
  enforceHTTPS();
  checkCookieSecurity();
  preventClickjacking();

  console.log("✅ Security checks initialized");
};

// ============================================================================
// Legacy Compatibility Exports (for existing login page)
// ============================================================================

/**
 * Alias for sanitizeInput
 */
export const sanitizeString = sanitizeInput;

/**
 * Validate email (wrapper around validation.ts for backwards compatibility)
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation with strength indicator
 */
export interface PasswordValidation {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  message?: string;
  errors?: string[]; // For compatibility with login page
}

export const validatePassword = (password: string): PasswordValidation => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      strength: "weak",
      message: "Password must be at least 6 characters",
      errors: ["Password must be at least 6 characters"],
    };
  }

  // Calculate strength
  let strength: "weak" | "medium" | "strong" = "weak";
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
    Boolean
  ).length;

  if (password.length >= 6 && criteriaCount >= 2) strength = "medium";
  if (password.length >= 8 && criteriaCount >= 3) strength = "strong";

  return {
    isValid: true,
    strength,
    errors: [],
  };
};

/**
 * Validate OTP format
 */
export const validateOTP = (otp: string, length: number = 6): { isValid: boolean; error?: string } => {
  const regex = new RegExp(`^\\d{${length}}$`);
  const isValid = regex.test(otp);
  
  return {
    isValid,
    error: isValid ? undefined : `OTP must be ${length} digits`
  };
};

/**
 * Sanitize OTP input (only allow digits)
 */
export const sanitizeOTP = (otp: string): string => {
  return otp.replace(/\D/g, "").slice(0, 6);
};

/**
 * Alias for detectSQLInjection
 */
export const hasSQLInjection = detectSQLInjection;

/**
 * Client-side rate limiter
 */
interface RateLimitRecord {
  attempts: number[];
}

const rateLimitStorage = new Map<string, RateLimitRecord>();

export const clientRateLimiter = {
  isRateLimited: (key: string, maxAttempts: number, windowMs: number): boolean => {
    const record = rateLimitStorage.get(key);
    if (!record) return false;

    const now = Date.now();
    const recentAttempts = record.attempts.filter((time) => now - time < windowMs);

    return recentAttempts.length >= maxAttempts;
  },

  recordAttempt: (key: string): void => {
    const record = rateLimitStorage.get(key) || { attempts: [] };
    record.attempts.push(Date.now());
    rateLimitStorage.set(key, record);
  },

  clearAttempts: (key: string): void => {
    rateLimitStorage.delete(key);
  },

  getTimeUntilReset: (key: string, windowMs: number): number => {
    const record = rateLimitStorage.get(key);
    if (!record || record.attempts.length === 0) return 0;

    const oldestAttempt = Math.min(...record.attempts);
    const resetTime = oldestAttempt + windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  },
};

/**
 * Check browser security features
 */
export interface BrowserSecurityCheck {
  https: boolean;
  httpsOnly: boolean; // Alias for https for compatibility
  cookiesEnabled: boolean;
  localStorage: boolean;
  warnings: string[];
}

export const checkBrowserSecurity = (): BrowserSecurityCheck => {
  const warnings: string[] = [];
  
  // Check HTTPS
  const https = typeof window !== "undefined" && window.location.protocol === "https:";
  if (!https && process.env.NODE_ENV === "production") {
    warnings.push("Application not served over HTTPS");
  }

  // Check cookies enabled
  const cookiesEnabled = typeof navigator !== "undefined" && navigator.cookieEnabled;
  if (!cookiesEnabled) {
    warnings.push("Cookies are disabled");
  }

  // Check localStorage
  let localStorage = false;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("test", "test");
      window.localStorage.removeItem("test");
      localStorage = true;
    }
  } catch {
    warnings.push("LocalStorage is disabled or unavailable");
  }

  return {
    https,
    httpsOnly: https, // Alias for compatibility
    cookiesEnabled,
    localStorage,
    warnings,
  };
};
