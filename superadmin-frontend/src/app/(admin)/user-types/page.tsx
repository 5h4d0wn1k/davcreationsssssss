"use client";

import React, { useState } from "react";
import UserTypeList from "../../../components/user-types/UserTypeList";
import UserTypeForm from "../../../components/user-types/UserTypeForm";
import UserTypeDetails from "../../../components/user-types/UserTypeDetails";
import { UserType } from "../../../services/types/userType";
import RoleGuard from "../../../components/layout/RoleGuard";

type ViewMode = "list" | "create" | "edit" | "view";

const UserTypesPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <UserTypesPageContent />
    </RoleGuard>
  );
};

const UserTypesPageContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);

  const handleViewUserType = (userType: UserType) => {
    setSelectedUserType(userType);
    setViewMode("view");
  };

  const handleEditUserType = (userType: UserType) => {
    setSelectedUserType(userType);
    setViewMode("edit");
  };

  const handleCreateUserType = () => {
    setSelectedUserType(null);
    setViewMode("create");
  };

  const handleFormSuccess = () => {
    setViewMode("list");
    setSelectedUserType(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedUserType(null);
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedUserType(null);
  };

  if (viewMode === "create") {
    return (
      <div className="p-6">
        <UserTypeForm onSuccess={handleFormSuccess} onCancel={handleCancel} />
      </div>
    );
  }

  if (viewMode === "edit" && selectedUserType) {
    return (
      <div className="p-6">
        <UserTypeForm
          userType={selectedUserType}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (viewMode === "view" && selectedUserType) {
    return (
      <div className="p-6">
        <UserTypeDetails
          userType={selectedUserType}
          onEdit={() => handleEditUserType(selectedUserType)}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <UserTypeList
        onViewUserType={handleViewUserType}
        onEditUserType={handleEditUserType}
        onCreateUserType={handleCreateUserType}
      />
    </div>
  );
};

export default UserTypesPage;