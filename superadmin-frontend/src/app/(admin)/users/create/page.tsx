"use client";

import React from "react";
import { useRouter } from "next/navigation";
import UserForm from "../../../../components/users/UserForm";

const CreateUserPage: React.FC = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/users");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="p-6">
      <UserForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default CreateUserPage;