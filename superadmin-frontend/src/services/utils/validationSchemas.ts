import * as yup from 'yup';

// Common validation schemas
export const emailSchema = yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required');

export const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )
  .required('Password is required');

export const confirmPasswordSchema = yup
  .string()
  .oneOf([yup.ref('password')], 'Passwords must match')
  .required('Please confirm your password');

export const phoneSchema = yup
  .string()
  .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .required('Phone number is required');

export const nameSchema = yup
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
  .required('Name is required');

// Form validation schemas
export const loginSchema = yup.object().shape({
  email: emailSchema,
  password: yup.string().required('Password is required'),
  otp: yup
    .string()
    .matches(/^\d{6}$/, 'OTP must be exactly 6 digits')
    .required('OTP is required'),
});

export const registerSchema = yup.object().shape({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
  phone: phoneSchema,
});

export const forgotPasswordSchema = yup.object().shape({
  email: emailSchema,
});

export const resetPasswordSchema = yup.object().shape({
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
});

export const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .matches(/^\d{6}$/, 'OTP must be exactly 6 digits')
    .required('OTP is required'),
});

export const userFormSchema = yup.object().shape({
  firstName: nameSchema,
  lastName: nameSchema,
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .test('unique-email', 'Email already exists', async function(value) {
      if (!value || this.parent.isEdit) return true; // Skip validation for edit mode
      try {
        // This would need to be implemented in the backend API
        // For now, we'll assume uniqueness check is handled server-side
        return true;
      } catch {
        return false;
      }
    }),
  phone: yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .required('Phone number is required')
    .test('unique-phone', 'Phone number already exists', async function(value) {
      if (!value || this.parent.isEdit) return true; // Skip validation for edit mode
      try {
        // This would need to be implemented in the backend API
        // For now, we'll assume uniqueness check is handled server-side
        return true;
      } catch {
        return false;
      }
    }),
  address: yup.string().min(5, 'Address must be at least 5 characters').required('Address is required'),
  userTypeId: yup.string().required('User type is required'),
  password: yup.string().when('$isEdit', ([isEdit], schema) => {
    return isEdit ? schema.optional() : passwordSchema;
  }),
  bankName: yup.string().optional(),
  bankIfscCode: yup.string().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format').optional(),
  bankAccountNumber: yup.string().matches(/^\d{9,18}$/, 'Account number must be 9-18 digits').optional(),
  bankAddress: yup.string().optional(),
  picture: yup.string().url('Please enter a valid URL').optional(),
  isActive: yup.boolean().optional(),
});

export const moduleFormSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, 'Module name must be at least 2 characters')
    .max(100, 'Module name must be less than 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/, 'Module name can only contain letters, numbers, spaces, hyphens, and underscores')
    .required('Module name is required'),
  urlSlug: yup
    .string()
    .min(2, 'URL slug must be at least 2 characters')
    .max(100, 'URL slug must be less than 100 characters')
    .matches(/^[a-z0-9\-]+$/, 'URL slug can only contain lowercase letters, numbers, and hyphens')
    .required('URL slug is required'),
  parentId: yup
    .string()
    .optional(),
  toolTip: yup
    .string()
    .max(200, 'Tooltip must be less than 200 characters')
    .optional(),
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isActive: yup
    .boolean()
    .optional(),
});

export const userTypeFormSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, 'User type name must be at least 2 characters')
    .max(50, 'User type name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'User type name can only contain letters and spaces')
    .required('User type name is required')
    .test('unique-name', 'User type name already exists', async function(value) {
      if (!value || this.parent.isEdit) return true; // Skip validation for edit mode
      try {
        // This would need to be implemented in the backend API
        // For now, we'll assume uniqueness check is handled server-side
        return true;
      } catch {
        return false;
      }
    }),
  isActive: yup.boolean().optional(),
});

export const permissionAssignmentSchema = yup.object().shape({
  userId: yup.string().required('User ID is required'),
  moduleId: yup.string().required('Module ID is required'),
});

export const bulkPermissionAssignmentSchema = yup.object().shape({
  userIds: yup.array()
    .of(yup.string().required())
    .min(1, 'At least one user must be selected')
    .required('Users are required'),
  moduleIds: yup.array()
    .of(yup.string().required())
    .min(1, 'At least one module must be selected')
    .required('Modules are required'),
});