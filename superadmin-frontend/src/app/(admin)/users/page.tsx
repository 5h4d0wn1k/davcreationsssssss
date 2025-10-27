"use client";

import React, { useState } from "react";
import UserList from "../../../components/users/UserList";
import UserForm from "../../../components/users/UserForm";
import UserDetails from "../../../components/users/UserDetails";
import { User } from "../../../services/types/user";
import RoleGuard from "../../../components/layout/RoleGuard";

type ViewMode = "list" | "create" | "edit" | "view";

const UsersPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin', 'manager']}>
      <UsersPageContent />
    </RoleGuard>
  );
};

const UsersPageContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewMode("view");
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setViewMode("edit");
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setViewMode("create");
  };

  const handleFormSuccess = () => {
    setViewMode("list");
    setSelectedUser(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedUser(null);
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedUser(null);
  };

  if (viewMode === "create") {
    return (
      <div className="p-6">
        <UserForm onSuccess={handleFormSuccess} onCancel={handleCancel} />
      </div>
    );
  }

  if (viewMode === "edit" && selectedUser) {
    return (
      <div className="p-6">
        <UserForm
          user={selectedUser}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (viewMode === "view" && selectedUser) {
    return (
      <div className="p-6">
        <UserDetails
          user={selectedUser}
          onEdit={() => handleEditUser(selectedUser)}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <UserList
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
};

export default UsersPage;