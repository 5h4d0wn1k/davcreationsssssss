"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import PasswordStrengthIndicator from "../common/PasswordStrengthIndicator";
import { User, CreateUserData, UpdateUserData } from "../../services/types/user";
import { userService } from "../../services/api/users";
import { userTypeService } from "../../services/api/userTypes";
import { UserType } from "../../services/types/userType";
import { userFormSchema } from "../../services/utils/validationSchemas";

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(userFormSchema),
    context: { isEdit: !!user },
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      userTypeId: "",
      bankName: "",
      bankIfscCode: "",
      bankAccountNumber: "",
      bankAddress: "",
      picture: "",
      ...(user && { isActive: user.isActive }),
    },
  });

  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const password = watch("password");

  const fetchUserTypes = useCallback(async () => {
    try {
      const response = await userTypeService.getUserTypes();
      setUserTypes(response || []);
    } catch (err) {
      console.error("Failed to load user types", err);
    }
  }, []);

  useEffect(() => {
    fetchUserTypes();
  }, [fetchUserTypes]);

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
        userTypeId: user.userTypeId || "",
        bankName: user.bankName || "",
        bankIfscCode: user.bankIfscCode || "",
        bankAccountNumber: user.bankAccountNumber || "",
        bankAddress: user.bankAddress || "",
        picture: user.picture || "",
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: CreateUserData | UpdateUserData) => {
    try {
      if (user) {
        await userService.updateUser(user.id, data as UpdateUserData);
        toast.success("User updated successfully");
      } else {
        await userService.createUser(data as CreateUserData);
        toast.success("User created successfully");
        reset(); // Reset form after successful creation
      }
      setTimeout(() => onSuccess(), 1500); // Delay to show success message
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || "Failed to save user";
      toast.error(errorMessage);
    }
  };

  const userTypeOptions = userTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">
        {user ? "Edit User" : "Create New User"}
      </h2>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="text"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                type="text"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="userTypeId">User Type *</Label>
              <Select
                options={userTypeOptions}
                placeholder="Select user type"
                onChange={(value) => setValue("userTypeId", value)}
              />
              {errors.userTypeId && (
                <p className="text-red-500 text-sm mt-1">{errors.userTypeId.message}</p>
              )}
            </div>
            {!user && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
                <PasswordStrengthIndicator password={password || ""} />
              </div>
            )}
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Banking Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                type="text"
                {...register("bankName")}
              />
              {errors.bankName && (
                <p className="text-red-500 text-sm mt-1">{errors.bankName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bankIfscCode">IFSC Code</Label>
              <Input
                id="bankIfscCode"
                type="text"
                {...register("bankIfscCode")}
              />
              {errors.bankIfscCode && (
                <p className="text-red-500 text-sm mt-1">{errors.bankIfscCode.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                type="text"
                {...register("bankAccountNumber")}
              />
              {errors.bankAccountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.bankAccountNumber.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bankAddress">Bank Address</Label>
              <Input
                id="bankAddress"
                type="text"
                {...register("bankAddress")}
              />
              {errors.bankAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.bankAddress.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Picture */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Profile Picture</h3>
          <div>
            <Label htmlFor="picture">Picture URL</Label>
            <Input
              id="picture"
              type="url"
              {...register("picture")}
              placeholder="https://example.com/image.jpg"
            />
            {errors.picture && (
              <p className="text-red-500 text-sm mt-1">{errors.picture.message}</p>
            )}
          </div>
        </div>

        {/* Status (for edit only) */}
        {user && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Status</h3>
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                {...register("isActive")}
                className="mr-2"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            {errors.isActive && (
              <p className="text-red-500 text-sm mt-1">{errors.isActive.message}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : user ? "Update User" : "Create User"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;