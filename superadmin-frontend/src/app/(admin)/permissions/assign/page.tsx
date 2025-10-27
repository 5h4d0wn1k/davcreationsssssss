"use client";

import React from "react";
import BulkAssignForm from "../../../../components/permissions/BulkAssignForm";

const BulkAssignPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Bulk Assign Permissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Assign multiple modules to multiple users at once
        </p>
      </div>

      <BulkAssignForm onBack={() => window.history.back()} />
    </div>
  );
};

export default BulkAssignPage;