"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { UserType, CreateUserTypeData, UpdateUserTypeData } from "../../services/types/userType";
import { userTypeService } from "../../services/api/userTypes";
import { useAuth } from "../../contexts/AuthContext";
import { userTypeFormSchema } from "../../services/utils/validationSchemas";

interface UserTypeFormProps {
  userType?: UserType;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserTypeForm: React.FC<UserTypeFormProps> = ({ userType, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm({
    resolver: yupResolver(userTypeFormSchema),
    defaultValues: {
      name: userType?.name || "",
      isActive: userType?.isActive ?? true,
    },
    mode: "onChange",
    context: { isEdit: !!userType },
  });

  useEffect(() => {
    if (userType) {
      reset({
        name: userType.name,
        isActive: userType.isActive,
      });
    } else {
      reset({
        name: "",
        isActive: true,
      });
    }
  }, [userType, reset]);

  const onSubmit = async (data: UpdateUserTypeData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (userType) {
        await userTypeService.updateUserType(userType.id, data);
        setSuccess("User type updated successfully");
      } else {
        await userTypeService.createUserType(data as CreateUserTypeData);
        setSuccess("User type created successfully");
      }
      setTimeout(() => onSuccess(), 1500); // Delay to show success message
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };

      if (apiError.response?.data?.errors) {
        // Handle validation errors from backend
        const validationErrors = Object.values(apiError.response.data.errors).flat();
        setError(validationErrors.join(', '));
      } else {
        setError(apiError.response?.data?.message || "Failed to save user type");
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is superadmin
  const isSuperAdmin = currentUser?.userType?.name === "superadmin";

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Only superadmin can manage user types.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">
        {userType ? "Edit User Type" : "Create New User Type"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">User Type Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                {...register("name")}
                placeholder="Enter user type name (e.g., Admin, Manager)"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Role hierarchy: Superadmin → Admin → Manager → User
              </p>
            </div>

            {userType && (
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  {...register("isActive")}
                  className="mr-2"
                />
                <Label htmlFor="isActive">Active</Label>
                {errors.isActive && (
                  <p className="text-sm text-red-600 ml-2">{errors.isActive.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading || !isDirty || !isValid}
          >
            {loading ? "Saving..." : userType ? "Update User Type" : "Create User Type"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserTypeForm;