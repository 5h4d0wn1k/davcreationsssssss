import { z } from 'zod';

// User schemas
export const loginUserSchema = z.object({
  email: z.email("Invalid email format"),
  user_password: z.string().min(1, "Password is required"),
  otp: z.string().min(1, "OTP is required")
});

export const createNewPasswordSchema = z.object({
  email: z.email("Invalid email format"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  otp: z.string().min(1, "OTP is required")
});

export const sendOtpSchema = z.object({
  email: z.email("Invalid email format")
});

export const verifyOtpSchema = z.object({
  email: z.email("Invalid email format"),
  otp: z.string().min(1, "OTP is required")
});


// Admin schemas
export const changeUserRoleSchema = z.object({
  user_type_name: z.string().min(1, "User type name is required")
});

export const createAdminUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  email: z.email("Invalid email format"),
  user_password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
  user_type_id: z.number().min(1, "User type ID is required"),
  is_active: z.boolean().optional()
});

export const updateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.email("Invalid email format").optional(),
  user_password: z.string().min(6, "Password must be at least 6 characters").optional(),
  address: z.string().optional(),
  user_type_id: z.string().optional(),
  is_active: z.boolean().optional()
});

export const createModuleSchema = z.object({
  module_name: z.string().min(1, "Name is required"),
  parent_id: z.number().optional(),
  url_slug: z.string().optional(),
  tool_tip: z.string().optional(),
  short_description: z.string().optional(),
  is_active: z.boolean().optional()
});

export const updateModuleSchema = z.object({
  module_name: z.string().min(1, "Name is required").optional(),
  parent_id: z.number().optional(),
  url_slug: z.string().optional(),
  tool_tip: z.string().optional(),
  short_description: z.string().optional(),
  is_active: z.boolean().optional()
});

export const assignModuleToUserSchema = z.object({
  user_id: z.number().min(1, "User ID is required"),
  module_id: z.number().min(1, "Module ID is required")
});

export const unassignModuleFromUserSchema = z.object({
  user_id: z.number().min(1, "User ID is required"),
  module_id: z.number().min(1, "Module ID is required")
});

export const createUserTypeSchema = z.object({
  user_type_name: z.string().min(1, "Name is required").optional(),
  user_type_value: z.number().min(1, "value is required").optional(),
});

export const updateUserTypeSchema = z.object({
  user_type_name: z.string().min(1, "Name is required").optional(),
  user_type_value: z.number().min(1, "value is required").optional(),
});

// Validation middleware function
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      console.log("from ",error.message);
      return res.status(400).json({
        error: "Validation failed",
        details:  error.message
        
      });
    }
  };
};