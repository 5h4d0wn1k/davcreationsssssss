"use client";

import React, { useState } from "react";
import Button from "../ui/button/Button";
import { UserType } from "../../services/types/userType";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, PencilIcon, TrashBinIcon as TrashIcon } from "../../icons";
import ConfirmationDialog from "../common/ConfirmationDialog";

interface UserTypeActionsProps {
  userType: UserType;
  onView: () => void;
  onEdit: () => void;
  onAction: (action: string, userTypeId: string) => void;
}

const UserTypeActions: React.FC<UserTypeActionsProps> = ({
  userType,
  onView,
  onEdit,
  onAction,
}) => {
  const { user: currentUser } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Only superadmin can manage user types
  const isSuperAdmin = currentUser?.userType?.name === "superadmin";

  if (!isSuperAdmin) {
    return null;
  }

  // Prevent deletion of predefined roles
  const predefinedRoles = ["superadmin", "admin", "manager", "user"];
  const canDelete = !predefinedRoles.includes(userType.name.toLowerCase());

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onAction("delete", userType.id);
    setShowDeleteDialog(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onView}
          className="p-2"
        >
          <EyeIcon className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="p-2"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>

        {canDelete && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteClick}
            className="p-2 text-red-600 hover:text-red-700"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        title="Delete User Type"
        message={`Are you sure you want to delete the "${userType.name}" user type? This action cannot be undone and may affect users assigned to this role.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </>
  );
};

export default UserTypeActions;