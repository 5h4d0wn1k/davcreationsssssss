/**
 * Form Validation Utilities
 * Client-side validation before API calls (prevents rate limiting)
 * 
 * ⚠️ Backend MUST still validate - never trust client-side validation alone
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidation {
  value: any;
  rules: ValidationRule[];
}

export interface ValidationRule {
  type: "required" | "email" | "minLength" | "maxLength" | "pattern" | "custom" | "numeric" | "match";
  message: string;
  value?: any; // For minLength, maxLength, pattern, match
  validator?: (value: any) => boolean; // For custom validation
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * At least 6 characters (matching backend requirement)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate phone number (basic format)
 */
export const isValidPhone = (phone: string): boolean => {
  // Allow optional + prefix, spaces, dashes, parentheses
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate required field
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate minimum length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validate maximum length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validate against regex pattern
 */
export const matchesPattern = (value: string, pattern: RegExp): boolean => {
  return pattern.test(value);
};

/**
 * Validate numeric value
 */
export const isNumeric = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate that two fields match (e.g., password confirmation)
 */
export const fieldsMatch = (value1: any, value2: any): boolean => {
  return value1 === value2;
};

/**
 * Apply validation rule to a value
 */
const applyRule = (value: any, rule: ValidationRule, formData?: Record<string, any>): string | null => {
  switch (rule.type) {
    case "required":
      return isRequired(value) ? null : rule.message;

    case "email":
      return value && isValidEmail(value) ? null : rule.message;

    case "minLength":
      return value && hasMinLength(value, rule.value as number) ? null : rule.message;

    case "maxLength":
      return value && hasMaxLength(value, rule.value as number) ? null : rule.message;

    case "pattern":
      return value && matchesPattern(value, rule.value as RegExp) ? null : rule.message;

    case "numeric":
      return value && isNumeric(value) ? null : rule.message;

    case "match":
      if (!formData || !rule.value) return rule.message;
      return fieldsMatch(value, formData[rule.value as string]) ? null : rule.message;

    case "custom":
      if (!rule.validator) return "Invalid custom validator";
      return rule.validator(value) ? null : rule.message;

    default:
      return null;
  }
};

/**
 * Validate a single field with multiple rules
 */
export const validateField = (value: any, rules: ValidationRule[], formData?: Record<string, any>): string | null => {
  for (const rule of rules) {
    const error = applyRule(value, rule, formData);
    if (error) return error; // Return first error
  }
  return null;
};

/**
 * Validate multiple fields
 */
export const validateForm = (fields: Record<string, FieldValidation>): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Extract form data for match validation
  const formData: Record<string, any> = {};
  for (const [fieldName, field] of Object.entries(fields)) {
    formData[fieldName] = field.value;
  }

  // Validate each field
  for (const [fieldName, field] of Object.entries(fields)) {
    const error = validateField(field.value, field.rules, formData);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Common validation rules for reuse
 */
export const commonRules = {
  required: (fieldName: string): ValidationRule => ({
    type: "required",
    message: `${fieldName} is required`,
  }),

  email: (): ValidationRule => ({
    type: "email",
    message: "Please enter a valid email address",
  }),

  password: (): ValidationRule => ({
    type: "minLength",
    value: 6,
    message: "Password must be at least 6 characters",
  }),

  minLength: (length: number, fieldName: string): ValidationRule => ({
    type: "minLength",
    value: length,
    message: `${fieldName} must be at least ${length} characters`,
  }),

  maxLength: (length: number, fieldName: string): ValidationRule => ({
    type: "maxLength",
    value: length,
    message: `${fieldName} must not exceed ${length} characters`,
  }),

  numeric: (fieldName: string): ValidationRule => ({
    type: "numeric",
    message: `${fieldName} must be a number`,
  }),

  passwordMatch: (passwordField: string): ValidationRule => ({
    type: "match",
    value: passwordField,
    message: "Passwords do not match",
  }),
};

/**
 * Validation schemas for common forms
 * Based on backend Zod schemas from Phase 1 analysis
 */

export const loginSchema = {
  email: {
    rules: [commonRules.required("Email"), commonRules.email()],
  },
  user_password: {
    rules: [commonRules.required("Password")],
  },
  otp: {
    rules: [commonRules.required("OTP")],
  },
};

export const createUserSchema = {
  first_name: {
    rules: [
      commonRules.required("First name"),
      commonRules.maxLength(100, "First name"),
    ],
  },
  last_name: {
    rules: [
      commonRules.required("Last name"),
      commonRules.maxLength(100, "Last name"),
    ],
  },
  email: {
    rules: [
      commonRules.required("Email"),
      commonRules.email(),
      commonRules.maxLength(150, "Email"),
    ],
  },
  user_password: {
    rules: [commonRules.required("Password"), commonRules.password()],
  },
  phone: {
    rules: [commonRules.maxLength(20, "Phone")],
  },
  user_type_id: {
    rules: [commonRules.required("User type"), commonRules.numeric("User type")],
  },
};

export const updateUserSchema = {
  first_name: {
    rules: [commonRules.maxLength(100, "First name")],
  },
  last_name: {
    rules: [commonRules.maxLength(100, "Last name")],
  },
  email: {
    rules: [commonRules.email(), commonRules.maxLength(150, "Email")],
  },
  user_password: {
    rules: [commonRules.password()],
  },
  phone: {
    rules: [commonRules.maxLength(20, "Phone")],
  },
};

export const createModuleSchema = {
  module_name: {
    rules: [
      commonRules.required("Module name"),
      commonRules.maxLength(150, "Module name"),
    ],
  },
  url_slug: {
    rules: [commonRules.maxLength(255, "URL slug")],
  },
  tool_tip: {
    rules: [commonRules.maxLength(255, "Tooltip")],
  },
};

export const forgotPasswordSchema = {
  email: {
    rules: [commonRules.required("Email"), commonRules.email()],
  },
  newPassword: {
    rules: [commonRules.required("New password"), commonRules.password()],
  },
  confirmPassword: {
    rules: [
      commonRules.required("Confirm password"),
      commonRules.passwordMatch("newPassword"),
    ],
  },
  otp: {
    rules: [commonRules.required("OTP")],
  },
};

export const sendOtpSchema = {
  email: {
    rules: [commonRules.required("Email"), commonRules.email()],
  },
};

/**
 * Validate field on change (for real-time validation)
 */
export const validateOnChange = (
  fieldName: string,
  value: any,
  schema: Record<string, { rules: ValidationRule[] }>,
  formData?: Record<string, any>
): string | null => {
  const fieldConfig = schema[fieldName];
  if (!fieldConfig) return null;

  return validateField(value, fieldConfig.rules, formData);
};

/**
 * Validate entire form against schema
 */
export const validateFormAgainstSchema = (
  formData: Record<string, any>,
  schema: Record<string, { rules: ValidationRule[] }>
): ValidationResult => {
  const fields: Record<string, FieldValidation> = {};

  for (const [fieldName, fieldConfig] of Object.entries(schema)) {
    fields[fieldName] = {
      value: formData[fieldName],
      rules: fieldConfig.rules,
    };
  }

  return validateForm(fields);
};
