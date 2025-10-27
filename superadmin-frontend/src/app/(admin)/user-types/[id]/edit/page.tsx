"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import UserTypeForm from "../../../../../components/user-types/UserTypeForm";
import { userTypeService } from "../../../../../services/api/userTypes";
import { UserType } from "../../../../../services/types/userType";

const EditUserTypePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserType = async () => {
      if (!params.id) return;

      try {
        const response = await userTypeService.getUserTypeById(params.id as string);
        setUserType(response.userType);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load user type");
        } else {
          setError("Failed to load user type");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [params.id]);

  const handleSuccess = () => {
    router.push("/user-types");
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="p-6">
        <div className="text-center">User type not found</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <UserTypeForm
        userType={userType}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditUserTypePage;