"use client";

import React from "react";
import { useRouter } from "next/navigation";
import UserTypeForm from "../../../../components/user-types/UserTypeForm";

const CreateUserTypePage: React.FC = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/user-types");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="p-6">
      <UserTypeForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default CreateUserTypePage;