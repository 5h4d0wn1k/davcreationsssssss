"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ModuleForm from "../../../../components/modules/ModuleForm";

const CreateModulePage: React.FC = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/modules");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="p-6">
      <ModuleForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default CreateModulePage;