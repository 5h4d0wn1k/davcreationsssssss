"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import UserForm from "../../../../../components/users/UserForm";
import { userService } from "../../../../../services/api/users";
import { User } from "../../../../../services/types/user";

const EditUserPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(userId);
      setUser(response);
    } catch (err) {
      setError("Failed to load user details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSuccess = () => {
    router.push(`/users/${userId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">User not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <UserForm user={user} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default EditUserPage;